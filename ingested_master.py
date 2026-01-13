import os
import time
import re
import pdfplumber
from pinecone import Pinecone
import google.generativeai as genai
from langchain_text_splitters import RecursiveCharacterTextSplitter
from supabase import create_client, Client
from dotenv import load_dotenv

# --- 1. CONFIGURATION & SETUP ---
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not all([GOOGLE_API_KEY, PINECONE_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    raise ValueError("❌ Missing API Keys! Check your .env file.")

# Configure Services
genai.configure(api_key=GOOGLE_API_KEY)
pc = Pinecone(api_key=PINECONE_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Constants
INDEX_NAME = "cue2clarity"
BUCKET_NAME = "course materials (input)"  # Must match your Supabase bucket name

# Connect to Pinecone Index
index = pc.Index(INDEX_NAME)

# --- 2. HELPER: UPLOAD FILE TO CLOUD ---
def upload_file_to_supabase(file_path):
    """Uploads the local PDF to Supabase and returns the public URL."""
    filename = os.path.basename(file_path)
    print(f"☁️  Uploading '{filename}' to Supabase Storage...")
    
    try:
        with open(file_path, 'rb') as f:
            # Upload file (overwrite if exists)
            supabase.storage.from_(BUCKET_NAME).upload(
                path=filename,
                file=f,
                file_options={"content-type": "application/pdf", "upsert": "true"}
            )
        
        # Get Public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)
        print(f"   ✅ Upload successful! Link: {public_url}")
        return public_url

    except Exception as e:
        print(f"   ⚠️ Upload failed (or file exists): {e}")
        # Try to get the URL anyway in case it was already there
        return supabase.storage.from_(BUCKET_NAME).get_public_url(filename)

# --- 3. HELPER: SAFE EMBEDDING ---
def get_embedding(text):
    retries = 5
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
                time.sleep((2 ** attempt) * 2)
            else:
                raise e
    raise Exception("Embedding failed.")

# --- 4. HELPER: TEXT CLEANING ---
def clean_and_repair_text(text):
    if not text: return ""
    replacements = {"\uf0e0": "->", "⇒": "=>", "→": "->", "–": "-"}
    for bad, good in replacements.items():
        text = text.replace(bad, good)
    return re.sub(r'\s+', ' ', text).strip()

def clear_cloud_data():
    """Wipes both Pinecone (Memory) and Supabase (Files)."""
    confirm = input("⚠️  WARNING: This deletes ALL files and memories. Type 'DELETE' to confirm: ")
    if confirm == "DELETE":
        print("☢️  Deleting Vectors from Pinecone...")
        index.delete(delete_all=True)
        
        print("☢️  Deleting Files from Supabase...")
        files = supabase.storage.from_(BUCKET_NAME).list()
        if files:
            file_names = [f['name'] for f in files]
            supabase.storage.from_(BUCKET_NAME).remove(file_names)
        
        print("✅ System Reset Complete.")
    else:
        print("Cancelled.")

# --- 5. MASTER INGESTION LOGIC ---
def ingest_master(file_path, subject, chapter):
    # Step A: Upload PDF to Cloud (The Body)
    pdf_url = upload_file_to_supabase(file_path)
    
    # Step B: Extract Text (The Mind)
    print(f"📖 extracting text from {file_path}...")
    full_text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t: full_text += clean_and_repair_text(t) + "\n\n"

    # Step C: Chunking
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_text(full_text)
    print(f"✂️  Split into {len(chunks)} chunks.")

    # Step D: Vectorize & Upload
    vectors = []
    print("🧠 Generating Vectors...")
    
    for i, chunk in enumerate(chunks):
        try:
            vector = get_embedding(chunk)
            
            # CRITICAL: We now add the 'pdf_url' to metadata!
            metadata = {
                "text": chunk,
                "subject": subject,
                "chapter": chapter,
                "source": os.path.basename(file_path),
                "pdf_url": pdf_url,  # <--- The Link
                "chunk_index": i
            }
            
            unique_id = f"{os.path.basename(file_path)}_{i}"
            vectors.append((unique_id, vector, metadata))
            time.sleep(0.3) # Rate limit help
        except:
            continue

    # Step E: Batch Upload to Pinecone
    BATCH_SIZE = 20
    print(f"🚀 Uploading {len(vectors)} vectors to Pinecone...")
    for i in range(0, len(vectors), BATCH_SIZE):
        batch = vectors[i : i+BATCH_SIZE]
        try:
            index.upsert(vectors=batch)
            print(f"   ✅ Batch {i//BATCH_SIZE + 1} Done")
        except Exception as e:
            print(f"   ❌ Error: {e}")

    print(f"\n🎉 Success! '{file_path}' is fully ingested.")
    print(f"🔗 File Link: {pdf_url}")

# --- 6. INTERACTIVE MENU ---
if __name__ == "__main__":
    while True:
        print("\n" + "═"*50)
        print("🌍 STUDENT AI: FULL CLOUD ADMIN")
        print("═"*50)
        print("1. 📥 Upload New Lecture (PDF + Brain)")
        print("2. ☢️  System Reset (Clear All Data)")
        print("3. ❌ Exit")
        
        choice = input("\nSelect: ").strip()
        
        if choice == "1":
            f = input("📄 PDF Filename: ").strip().strip('"')
            if os.path.exists(f):
                s = input("📚 Subject: ")
                c = input("📑 Chapter: ")
                ingest_master(f, s, c)
            else:
                print("❌ File not found.")
        elif choice == "2":
            clear_cloud_data()
        elif choice == "3":
            break