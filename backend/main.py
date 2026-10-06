from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Patient, Encounter, InsightFlag, engine, Base
from genai import run_genai_pipeline
from analytics import get_hospital_metrics
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI(title="Hospital Intelligence Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/patients")
def read_patients(db: Session = Depends(get_db)):
    patients = db.query(Patient).all()
    return patients

@app.get("/api/patients/{patient_id}/summary")
def generate_patient_summary(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Trigger LangGraph GenAI Pipeline
    result = run_genai_pipeline(patient_id)
    
    return {
        "patient": {"name": patient.name, "age": patient.age},
        "ai_summary": result.get("summary", "No summary generated."),
        "risk_flags": result.get("flags", []),
        "langgraph_trace": {
            "retrieved_guidelines": result.get("retrieved_guidelines", ""),
            "decision_path": "Extract -> Retrieve -> Summarize -> Flag"
        }
    }

@app.get("/api/analytics/dashboard")
def get_analytics():
    return get_hospital_metrics()

@app.get("/api/debug/database")
def view_database(db: Session = Depends(get_db)):
    patients = db.query(Patient).limit(5).all()
    flags = db.query(InsightFlag).limit(5).all()
    return {
        "tables": {
            "patients_count": db.query(Patient).count(),
            "encounters_count": db.query(Encounter).count(),
            "insight_flags_count": db.query(InsightFlag).count()
        },
        "engine": str(engine.url),
        "sample_patients": patients,
        "sample_flags": flags
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
