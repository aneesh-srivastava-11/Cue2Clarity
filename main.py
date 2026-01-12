import os
import time
import uvicorn
import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# Google & Chroma Libraries
import google.generativeai as genai
import chromadb
from chromadb.utils import embedding_functions

# --- 1. CONFIGURATION ---
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError("❌ Missing API Key! Check your .env file.")

genai.configure(api_key=GOOGLE_API_KEY)
# Using Flash for speed and higher rate limits
model = genai.GenerativeModel('models/gemini-2.5-flash')

client = chromadb.PersistentClient(path="./student_ai_db")
google_ef = embedding_functions.GoogleGenerativeAiEmbeddingFunction(
    api_key=GOOGLE_API_KEY,
    model_name="models/text-embedding-004"
)

collection = client.get_or_create_collection(
    name="academic_material",
    embedding_function=google_ef
)

app = FastAPI(title="Student AI Backend (Final)")

# ✅ RESTORED: The Mode Parameter
class QueryRequest(BaseModel):
    question: str
    mode: str = "LECTURE"  # Default to Lecture if not sent

# --- 2. HELPER: SAFE EMBEDDING (Retries if Google is busy) ---
def embed_text_with_retry(text):
    retries = 3
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
                wait_time = (attempt + 1) * 2
                print(f"⚠️ Embedding Rate Limit hit. Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise e
    raise HTTPException(status_code=429, detail="Server is too busy. Please wait 1 minute.")

# --- REPLACE YOUR EXISTING RETRY FUNCTIONS WITH THESE ---

# HELPER: SUPER SAFE EMBEDDING 🛡️
def embed_text_with_retry(text):
    retries = 5  # Increased retries
    base_wait = 10 # Start waiting at 10 seconds (not 2)
    
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
                wait_time = base_wait * (2 ** attempt) # 10s, 20s, 40s...
                print(f"\n⏳ API Busy (Embedding). Pausing for {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise e # Real error (crash)

    raise HTTPException(status_code=429, detail="Google API is too busy. Please wait 2 minutes.")


# HELPER: SUPER SAFE GENERATION 🛡️
def generate_with_retry(prompt):
    retries = 5
    base_wait = 10 
    
    for attempt in range(retries):
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            if "429" in str(e) or "ResourceExhausted" in str(e):
                wait_time = base_wait * (2 ** attempt) # 10s, 20s, 40s...
                print(f"\n⏳ API Busy (Generation). Pausing for {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise e

    raise HTTPException(status_code=429, detail="AI Overloaded. Try again later.")

# --- 4. HELPER: TEXT CLEANING (Nuclear Option) ---
def clean_text(text):
    if not text: return ""
    # Fix standard arrows
    text = text.replace("→", "->").replace("⇒", "=>")
    # Kill private unicode (broken PDF symbols)
    text = re.sub(r'[\ue000-\uf8ff]', '->', text)
    return text

# --- 5. THE ENDPOINT ---
@app.post("/chat")
async def chat_endpoint(request: QueryRequest):
    print(f"\n📨 [{request.mode}] Question: {request.question}")
    
    try:
        # STEP A: Embed Question
        query_vector = embed_text_with_retry(request.question)
        
        # STEP B: Search Database
        results = collection.query(
            query_embeddings=[query_vector],
            n_results=10 # High context for "Lenient" answers
        )
        
        if not results['documents'] or not results['documents'][0]:
            context_text = "No relevant notes found."
            sources = []
        else:
            # Clean chunks before giving them to Gemini
            raw_chunks = results['documents'][0]
            context_text = "\n\n".join([clean_text(c) for c in raw_chunks])
            sources = results['metadatas'][0]

        # STEP C: Construct the "Hybrid" Prompt
        # This includes the Logic from your Tech Stack Document + The Code Fixes
        system_instruction = f"""
        You are STUDENT-AI, an expert academic tutor.
        
        YOUR MODE: {request.mode}
        
        ────────────────────────────────────
        MODE INSTRUCTIONS
        ────────────────────────────────────
        [LECTURE] -> Explain concepts clearly. Define terms. Use examples from notes.
        [ASSIGNMENT] -> Do NOT give the answer. Give hints and point to the theory.
        [EXAM] -> Analyze past trends. Mention how often this topic appears.
        [DIFFICULTY] -> Rate as Easy/Medium/Hard based on complexity.
        
        ────────────────────────────────────
        CORE RULES
        ────────────────────────────────────
        1. CONTEXT ONLY: Answer using the notes below.
        2. CLEAN OUTPUT: Use plain text only. No Unicode arrows (->), no emojis.
        3. BE HELPFUL: If asked for a concept, define it AND list types/examples if found.
        
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