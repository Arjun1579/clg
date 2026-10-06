import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv('../.env')
llm = ChatOpenAI(
    api_key=os.getenv('OPENROUTER_API_KEY').strip('"\''), 
    base_url='https://openrouter.ai/api/v1', 
    model_name='google/gemini-2.0-flash-lite-preview-02-05:free'
)
print(llm.invoke('Hi').content)
