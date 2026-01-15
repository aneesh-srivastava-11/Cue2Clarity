import os
import time
import uvicorn
import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

# Allow requests from your local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development; change to specific URL later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Question(BaseModel):
    question: str

@app.post("/chat")
async def chat(request: Question):
    # Your existing logic here...
    return {
        "answer": "This is a test response from the backend!", 
        "sources": []
    }



# Google Library
import google.generativeai as genai

# ✅ NEW: Pinecone Library
from pinecone import Pinecone

# --- 1. CONFIGURATION ---
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY") # <--- Get this from .env

if not GOOGLE_API_KEY:
    raise ValueError("❌ Missing Google API Key! Check your .env file.")
if not PINECONE_API_KEY:
    raise ValueError("❌ Missing Pinecone API Key! Check your .env file.")

# Configure Gemini
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('models/gemini-2.5-flash')

# ✅ CONNECT TO PINECONE
pc = Pinecone(api_key=PINECONE_API_KEY)
index_name = "cue2clarity" # Make sure this matches the index name you created on pinecone.io

# Connect to the index
index = pc.Index(index_name)

app = FastAPI(title="Student AI Backend (Pinecone Cloud)")

class QueryRequest(BaseModel):
    question: str
    mode: str = "LECTURE"

# --- 2. HELPER: SAFE EMBEDDING ---
def embed_text_with_retry(text):
    retries = 5 
    base_wait = 10
    
    for attempt in range(retries):
        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_query"
            )
            return result['embedding']
        except Exception as e:
            if "429" in str(e) or "ResourceExhausted" in str(e):
                wait_time = base_wait * (2 ** attempt)
                print(f"\n⏳ API Busy (Embedding). Pausing for {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise e 

    raise HTTPException(status_code=429, detail="Google API is too busy. Please wait 2 minutes.")

# --- 3. HELPER: SAFE GENERATION ---
def generate_with_retry(prompt):
    retries = 5
    base_wait = 10 
    
    for attempt in range(retries):
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            if "429" in str(e) or "ResourceExhausted" in str(e):
                wait_time = base_wait * (2 ** attempt)
                print(f"\n⏳ API Busy (Generation). Pausing for {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise e

    raise HTTPException(status_code=429, detail="AI Overloaded. Try again later.")

# --- 4. HELPER: TEXT CLEANING ---
def clean_text(text):
    if not text: return ""
    text = text.replace("→", "->").replace("⇒", "=>")
    text = re.sub(r'[\ue000-\uf8ff]', '->', text)
    return text

# --- 5. THE ENDPOINT ---
@app.post("/chat")
async def chat_endpoint(request: QueryRequest):
    print(f"\n📨 [{request.mode}] Question: {request.question}")
    
    try:
        # STEP A: Embed Question (Google)
        query_vector = embed_text_with_retry(request.question)

        # STEP B: Search Database (Pinecone)
        search_results = index.query(
            vector=query_vector,
            top_k=10,
            include_metadata=True
        )
        
        matches = search_results['matches']
        if not matches:
            context_text = "No relevant notes found."
            sources = []
        else:
            # 1. Extract the text for the AI to read
            raw_chunks = [match['metadata']['text'] for match in matches if 'text' in match['metadata']]
            context_text = "\n\n".join([clean_text(c) for c in raw_chunks])
            
            # 2. Extract sources for the User to click (Unique list)
            # We use a dictionary to remove duplicates based on the 'source' filename
            unique_sources = {}
            for match in matches:
                meta = match['metadata']
                filename = meta.get('source', 'Unknown')
                
                if filename not in unique_sources:
                    unique_sources[filename] = {
                        "source": filename,
                        "pdf_url": meta.get('pdf_url', None), # <--- THIS IS THE NEW PART
                        "chapter": meta.get('chapter', 'General'),
                        "score": match['score']
                    }
            
            # Convert back to a list
            sources = list(unique_sources.values())

        # STEP C: Construct Prompt (Standard)
        system_instruction = f"""
        You are STUDENT-AI, a warm, encouraging, and intelligent academic tutor.
        
        YOUR GOAL: 
        Make the student feel supported while explaining complex topics clearly.
        
        YOUR MODE: {request.mode}
        
        ────────────────────────────────────
        VISUAL STYLE RULES (SOOTHING LAYOUT)
        ────────────────────────────────────
        1. USE HEADERS: Start every major section with "### " (e.g., "### The Core Concept").
        2. BOLDING: Use **bold text** to highlight keywords.
        3. WHITESPACE: Short paragraphs. Blank lines between items.
        4. LISTS: Use bullet points (-).
        
        ────────────────────────────────────
        TONE & PERSONA
        ────────────────────────────────────
        1. WARM OPENER: Start friendly.
        2. EMPATHY: Validate difficult topics.
        3. ANALOGIES: Use simple comparisons.
        
        ────────────────────────────────────
        CORE RULES
        ────────────────────────────────────
        1. CONTEXT ONLY: Answer strictly using the notes below.
        2. CLEAN OUTPUT: No Unicode arrows (->).
        3. CITATIONS: Mention [Chapter: X] or [Source: Y].
        
        ────────────────────────────────────
        CONTEXT
        ────────────────────────────────────
        {context_text}
        ────────────────────────────────────
        
        QUESTION:
        {request.question}
        """

        # STEP D: Generate
        answer = generate_with_retry(system_instruction)
        final_answer = clean_text(answer)

        return {
            "answer": final_answer,
            "sources": sources
        }

    except Exception as e:
        print(f"❌ CRITICAL ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)