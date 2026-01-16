import os
import time
import shutil
import uvicorn
import re
import sys
import pdfplumber
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# AI & Database Libraries
import google.generativeai as genai
from pinecone import Pinecone
from supabase import create_client, Client
from langchain_text_splitters import RecursiveCharacterTextSplitter

# --- 1. CONFIGURATION ---
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
# 🔒 SIMPLE ADMIN PASSWORD
ADMIN_SECRET = os.getenv("ADMIN_SECRET")

if not all([GOOGLE_API_KEY, PINECONE_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    raise ValueError("❌ Missing API Keys! Check your .env file.")

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('models/gemini-2.5-flash')

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index("cue2clarity")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
BUCKET_NAME = "course materials (input)"

# 🔒 STRICTNESS SETTINGS
SCORE_THRESHOLD = 0.35 

app = FastAPI(title="Cue2Clarity Backend (Always On)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class QueryRequest(BaseModel):
    question: str
    mode: str = "LECTURE"
    difficulty: str = "Medium"

class DeleteTopicRequest(BaseModel):
    subject: str

class NukeRequest(BaseModel):
    confirmation: str

# --- 2. HELPERS ---
def clean_and_repair_text(text):
    if not text: return ""
    replacements = {"\uf0e0": "->", "⇒": "=>", "→": "->", "–": "-", "•": "-"}
    for bad, good in replacements.items():
        text = text.replace(bad, good)
    return re.sub(r'\s+', ' ', text).strip()

DIST_DIR = os.path.join(os.path.dirname(__file__), "../Front/Frontend/dist")
print(f"🔍 DEBUG: Calculated DIST_DIR: {os.path.abspath(DIST_DIR)}")

if os.path.exists(DIST_DIR):
    print(f"✅ DEBUG: Found DIST_DIR. Contents: {os.listdir(DIST_DIR)}")
    # Mount assets folder (e.g. /assets/index-D8zs....js)
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    @app.get("/")
    async def serve_root():
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

    @app.get("/{catchall:path}")
    async def serve_react_app(catchall: str):
        # Check if requested file exists in dist (e.g. vite.svg, favicon.ico)
        file_path = os.path.join(DIST_DIR, catchall)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Otherwise, return index.html for React Router to handle
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
else:
    print(f"⚠️ WARNING: Frontend 'dist' directory NOT FOUND at {os.path.abspath(DIST_DIR)}")
    print(f"📂 CWD: {os.getcwd()}")
    try:
        print(f"📂 Listing ../Front/Frontend: {os.listdir('../Front/Frontend')}")
    except Exception as e:
        print(f"❌ Error listing ../Front/Frontend: {e}")

    @app.get("/")
    async def serve_root_error():
        return {
            "error": "Frontend build not found.",
            "diagnostics": {
                "dist_dir_calculated": os.path.abspath(DIST_DIR),
                "cwd": os.getcwd(),
                "exists": os.path.exists(DIST_DIR)
            }
        }

def sanitize_filename(filename):
    filename = re.sub(r'[^\x00-\x7f]', r'', filename)
    filename = re.sub(r'[\s\[\]\(\)]+', '_', filename)
    return filename.strip('_')

def embed_text_with_retry(text):
    retries = 3
    for attempt in range(retries):
        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            if "429" in str(e):
                time.sleep(2 ** attempt)
            else:
                raise e
    raise HTTPException(status_code=429, detail="Google API Busy")

def clean_response_text(text):
    if not text: return ""
    return re.sub(r'[\ue000-\uf8ff]', '->', text).replace("→", "->")

# --- 3. PROMPT TEMPLATES ---
PROMPT_TEMPLATES = {
    "LECTURE": """
    You are STUDENT-AI, a warm and encouraging academic tutor.
    GOAL: Explain the answer clearly using ONLY the context provided below.
    
    CRITICAL RULE:
    - If the answer is not in the context, say "I don't see that information in your notes."
    - Do not make up facts.
    
    VISUAL STYLE RULES:
    1. **Bolding**: Use double asterisks (**) to bold key terms.
    2. **Headers**: Start major sections with "* ".
    3. **Lists**: Use hyphens (- ) for bullet points.
    4. **Whitespace**: Add a blank line between every paragraph.
    """,
    
    "QUIZ": """
    You are an Exam Generator.
    GOAL: Generate 10 Multiple-Choice Questions (MCQs) based STRICTLY on the context provided.
    
    FORMAT FOR EACH QUESTION:
    1. [Question Text]
       a) [Option A]
       b) [Option B]
       c) [Option C]
       d) [Option D]
       
    *Correct Answer: [Option Letter]*
    
    RULES:
    - Questions must test understanding, not just memorization.
    - Vary the difficulty.
    - If the context is too short, generate as many valid questions as possible (up to 5).
    """,
    
    "ASSIGNMENT": """
    You are a Socratic Tutor helping a student with their homework.
    GOAL: Guide the student to the answer WITHOUT giving it away immediately.
    
    RULES:
    1. **Do NOT solve the problem completely.**
    2. Provide **Hints**: Point them to the specific concept in the notes they need.
    3. **Break it down**: If the question is complex, ask them a simpler leading question first.
    4. **Formulas**: If a formula is required and present in the notes, show the formula but let them plug in the numbers.
    
    RESPONSE FORMAT:
    * **Concept Check**: Brief explanation of the relevant theory from the notes.
    * **Hint**: A clue or next step.
    * **Guiding Question**: Ask them something to check their understanding.
    """,

    "RSOC": """
    You are an Academic Analyst using the RSOC (Recitation, Summary, Outline, Connection) framework.
    GOAL: Provide a structured, deep-dive analysis of the topic based strictly on the provided context.

    RESPONSE STRUCTURE:
    1. **R - Recitation**: Define the concept or directly answer the question with precision using the notes.
    2. **S - Summary**: Provide a concise 2-3 sentence overview of the topic's main idea.
    3. **O - Outline**: Create a structured bullet-point list of the key components, steps, or arguments found in the text.
    4. **C - Connection**: Explain how this topic connects to broader themes or other concepts mentioned in the notes.

    VISUAL RULES:
    - Use clear headings for each letter (e.g., "### R - Recitation").
    - Use bolding for key terms.
    """
}

# --- 4. ENDPOINTS ---

@app.post("/chat")
async def chat_endpoint(request: QueryRequest):
    print(f"\n📨 [{request.mode}] Question: {request.question} | Diff: {request.difficulty}")
    
    try:
        query_vector = embed_text_with_retry(request.question)
        search_results = index.query(vector=query_vector, top_k=8, include_metadata=True)
        matches = search_results['matches']
        
        # Guardrail
        if not matches or matches[0]['score'] < SCORE_THRESHOLD:
            return {
                "answer": "I'm sorry, I couldn't find any information about that specific topic in your uploaded notes.",
                "sources": []
            }

        raw_chunks = [m['metadata']['text'] for m in matches if 'text' in m['metadata']]
        context_text = "\n\n".join([clean_response_text(c) for c in raw_chunks])
        
        # Extract Sources
        unique_sources = {}
        for m in matches:
            filename = m['metadata'].get('source', 'Unknown')
            if filename not in unique_sources:
                unique_sources[filename] = {
                    "source": filename,
                    "pdf_url": m['metadata'].get('pdf_url', None),
                    "chapter": m['metadata'].get('chapter', 'General'),
                    "score": m['score']
                }
        sources = list(unique_sources.values())

        # --- 🧠 UPDATED PROMPT INJECTION ---
        final_user_input = request.question
        
        if request.mode == "QUIZ":
            final_user_input = f"Generate 10 {request.difficulty}-level Multiple Choice Questions (MCQs) specifically about the topic: '{request.question}'. Ensure they are solvable using the provided context."
        
        elif request.mode == "ASSIGNMENT":
            final_user_input = f"I am working on an assignment about '{request.question}'. Please provide a Socratic hint or guiding question to help me solve it, but DO NOT give me the direct answer yet."

        elif request.mode == "RSOC":
            final_user_input = f"Analyze the topic '{request.question}' using the RSOC (Recitation, Summary, Outline, Connection) format based strictly on the provided context."

        base_prompt = PROMPT_TEMPLATES.get(request.mode.upper(), PROMPT_TEMPLATES["LECTURE"])
        
        system_instruction = f"""
        {base_prompt}
        CONTEXT (Use ONLY this):
        {context_text}
        USER REQUEST:
        {final_user_input}
        """

        response = model.generate_content(system_instruction)
        return {"answer": clean_response_text(response.text), "sources": sources}

    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    subject: str = Form(...),
    chapter: str = Form(...)
):
    safe_filename = sanitize_filename(file.filename)
    print(f"📥 Uploading: {safe_filename} | Subject: {subject} | Chapter: {chapter}")
    
    temp_filename = f"temp_{safe_filename}"
    
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        with open(temp_filename, "rb") as f:
            file_bytes = f.read()
            supabase.storage.from_(BUCKET_NAME).upload(
                path=safe_filename, 
                file=file_bytes, 
                file_options={"content-type": "application/pdf", "upsert": "true"}
            )
        
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(safe_filename)

        full_text = ""
        with pdfplumber.open(temp_filename) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t: full_text += clean_and_repair_text(t) + "\n\n"

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_text(full_text)
        
        vectors = []
        for i, chunk in enumerate(chunks):
            embedding = embed_text_with_retry(chunk)
            vectors.append({
                "id": f"{safe_filename}_chunk_{i}",
                "values": embedding,
                "metadata": {
                    "text": chunk,
                    "source": safe_filename,
                    "subject": subject,
                    "chapter": chapter,
                    "pdf_url": public_url,
                    "chunk_index": i
                }
            })

        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            index.upsert(vectors=vectors[i:i + batch_size])
        
        return {"status": "success", "filename": safe_filename, "chunks": len(chunks)}

    except Exception as e:
        print(f"❌ Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

# --- 5. ADMIN ENDPOINTS ---

@app.delete("/admin/delete-topic")
async def delete_topic(request: DeleteTopicRequest, x_admin_secret: str = Header(None)):
    """Deletes all memories tagged with a specific Subject."""
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid Admin Password")
    
    target_subject = request.subject.strip()
    if not target_subject:
        raise HTTPException(status_code=400, detail="Subject cannot be empty")

    try:
        print(f"🗑️ ADMIN: Deleting topic '{target_subject}'...")
        index.delete(filter={"subject": target_subject})
        return {"status": "success", "message": f"Deleted all memories for topic: {target_subject}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/admin/nuke-system")
async def nuke_system(request: NukeRequest, x_admin_secret: str = Header(None)):
    """Wipes ALL Pinecone Vectors and Supabase Files."""
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid Admin Password")
    
    if request.confirmation != "DELETE_EVERYTHING":
        raise HTTPException(status_code=400, detail="Confirmation string mismatch. Type 'DELETE_EVERYTHING'.")

    try:
        print("☢️ ADMIN: NUKING SYSTEM...")
        index.delete(delete_all=True)
        
        files = supabase.storage.from_(BUCKET_NAME).list()
        if files:
            file_names = [f['name'] for f in files]
            if file_names:
                supabase.storage.from_(BUCKET_NAME).remove(file_names)
        
        print("✅ System Reset Complete.")
        return {"status": "success", "message": "System fully reset."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)