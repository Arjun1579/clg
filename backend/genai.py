import os
import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_groq import ChatGroq

from dotenv import load_dotenv
from database import SessionLocal, Encounter, InsightFlag
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
import json

# Ensure `.env` is loaded
load_dotenv(dotenv_path="../.env")

# 1. FAISS RAG Setup
guidelines = [
    Document(page_content="Guideline A: Systolic BP over 140 or Diastolic over 90 is considered High Blood Pressure (Hypertension).", metadata={"source": "AHA 2023"}),
    Document(page_content="Guideline B: Taking Aspirin and Ibuprofen together can increase the risk of gastrointestinal bleeding. Medication conflict.", metadata={"source": "Pharmacy Ref"}),
    Document(page_content="Guideline C: Patients with Diabetes should closely monitor blood sugar when given steroids.", metadata={"source": "Endo Society"}),
    Document(page_content="Guideline D: Resting heart rate over 100 bpm is considered Tachycardia.", metadata={"source": "Cardiology Basics"}),
    Document(page_content="Guideline E: Ibuprofen is contraindicated for patients with severe asthma.", metadata={"source": "Asthma Allergy Guide"}),
    Document(page_content="Guideline F: Cancer patients undergoing active treatment require strict monitoring of white blood cell counts for neutropenia.", metadata={"source": "Oncology Guidelines"}),
    Document(page_content="Guideline G: The maximum daily dose of Paracetamol (Acetaminophen) is 4000mg to prevent acute hepatotoxicity.", metadata={"source": "Hepatology Board"}),
]

def get_faiss_index():
    # Very simple mock embedding function using a dummy length (in real app, use HuggingFaceEmbeddings)
    # To keep it completely free and lightweight without large models, we'll use a local mock or bypass
    # Wait, the bluebook says "FAISS RAG". Let's use a tiny HuggingFace model or just keyword search if needed.
    pass

class AgentState(TypedDict):
    patient_id: int
    notes: str
    medications: str
    lab_bp: str
    retrieved_guidelines: str
    flags: List[dict]
    summary: str
    readmission_risk: str # Module

#vector rag
def init_rag():
    try:
        from langchain_huggingface import HuggingFaceEmbeddings
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        vectorstore = FAISS.from_documents(guidelines, embeddings)
        return vectorstore
    except Exception as e:
        print("Warning: HuggingFaceEmbeddings not installed or failed. Using mock RAG.")
        return None

vectorstore = init_rag()

def node_extract(state: AgentState):
    db = SessionLocal()
    enc = db.query(Encounter).filter(Encounter.patient_id == state['patient_id']).first()
    from database import Patient
    pat = db.query(Patient).filter(Patient.id == state['patient_id']).first()
    
    if enc and pat:
        state['notes'] = enc.clinical_notes
        state['medications'] = enc.medications
        state['lab_bp'] = f"{enc.lab_bp_systolic}/{enc.lab_bp_diastolic}"
        
        # Module: Simple CDSS Readmission Risk Algorithm
        risk_score = 0
        if pat.age > 60: risk_score += 1
        if getattr(pat, 'admission_type', 'Elective') == 'Emergency': risk_score += 2
        if getattr(enc, 'test_results', 'Normal') == 'Abnormal': risk_score += 2
        
        if risk_score >= 3:
            state['readmission_risk'] = 'High'
        elif risk_score >= 1:
            state['readmission_risk'] = 'Medium'
        else:
            state['readmission_risk'] = 'Low'
    else:
        state['readmission_risk'] = 'Unknown'
        
    db.close()
    return state

def node_retrieve(state: AgentState):
    query = f"Blood pressure {state['lab_bp']}, medications: {state['medications']}"
    if vectorstore:
        docs = vectorstore.similarity_search(query, k=2)
        state['retrieved_guidelines'] = "\n".join([d.page_content for d in docs])
    else:
        # Mock retrieval if HF fails
        import random
        docs = random.sample(guidelines, 2)
        state['retrieved_guidelines'] = "\n".join([d.page_content for d in docs])
    return state

def node_summarize(state: AgentState):
    groq_api_key = os.getenv("GROQ_API_KEY", "").strip('"\'')
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "").strip('"\'')
    
    if (not groq_api_key or groq_api_key == "your_groq_api_key_here") and not openrouter_api_key:
        state['summary'] = "MOCK SUMMARY: Patient presents with chest pain. API Key missing."
        state['flags'] = [{"type": "Medication Conflict", "desc": "Aspirin + Ibuprofen", "source": "Mock Guideline"}]
        return state

    try:
        if openrouter_api_key:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(
                api_key=openrouter_api_key, 
                base_url="https://openrouter.ai/api/v1",
                model_name="meta-llama/llama-3.1-8b-instruct" # Highly stable, standard model
            )
        else:
            llm = ChatGroq(api_key=groq_api_key, model_name="mixtral-8x7b-32768")
            
        prompt = f"""
        You are a clinical AI. Summarize the following notes chronologically and identify any flags based ONLY on the retrieved guidelines.
        Notes: {state['notes']}
        Medications: {state['medications']}
        Lab BP: {state['lab_bp']}
        Guidelines: {state['retrieved_guidelines']}
        
        CRITICAL RULES:
        1. You MUST output strictly in JSON format.
        2. If the patient's condition or medications do NOT directly violate or trigger the retrieved guidelines, you MUST leave the 'flags' array empty ([]). Do NOT make assumptions or hallucinate connections.
        
        Expected JSON structure:
        {{
            "summary": "your string summary here",
            "flags": [
                {{"type": "Risk Type", "desc": "Risk Description", "source": "Guideline Source"}}
            ]
        }}
        Do NOT wrap in markdown. Do NOT add conversational text. Output pure JSON only.
        """
        response = llm.invoke(prompt)
        res_text = response.content.strip()
        
        import re, json
        json_match = re.search(r'\{.*\}', res_text, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group(0))
                state['summary'] = data.get('summary', '')
                state['flags'] = data.get('flags', [])
            except Exception as e:
                state['summary'] = res_text
                state['flags'] = []
        else:
            state['summary'] = res_text
            state['flags'] = []
    except Exception as e:
        state['summary'] = f"Error calling AI Model: {e}"
        state['flags'] = []

    return state

def node_flag(state: AgentState):
    # Save flags to DB
    db = SessionLocal()
    for f in state['flags']:
        flag = InsightFlag(
            patient_id=state['patient_id'],
            flag_type=f.get('type', 'Flag'),
            description=f.get('desc', ''),
            guideline_source=f.get('source', '')
        )
        db.add(flag)
    db.commit()
    db.close()
    return state

# LangGraph Build
workflow = StateGraph(AgentState)
workflow.add_node("Extract", node_extract)
workflow.add_node("Retrieve", node_retrieve)
workflow.add_node("Summarize", node_summarize)
workflow.add_node("Flag", node_flag)

workflow.set_entry_point("Extract")
workflow.add_edge("Extract", "Retrieve")
workflow.add_edge("Retrieve", "Summarize")
workflow.add_edge("Summarize", "Flag")
workflow.add_edge("Flag", END)

app_graph = workflow.compile()

def run_genai_pipeline(patient_id: int):
    final_state = app_graph.invoke({"patient_id": patient_id, "notes": "", "medications": "", "lab_bp": "", "retrieved_guidelines": "", "flags": [], "summary": "", "readmission_risk": "Unknown"})
    return final_state
