import os
import time
import re
import chromadb
from chromadb.utils import embedding_functions
import pdfplumber
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv

# --- 1. CONFIGURATION & SETUP ---
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError("❌ API Key missing! Check your .env file.")

# Connect to ChromaDB
client = chromadb.PersistentClient(path="./student_ai_db")
google_ef = embedding_functions.GoogleGenerativeAiEmbeddingFunction(
    api_key=GOOGLE_API_KEY,
    model_name="models/text-embedding-004"
)

# Reset the collection to ensure a clean slate (Optional but recommended)
try:
    client.delete_collection("academic_material")
    print("🗑️  Deleted old collection to avoid duplicates.")
except:
    pass # Collection didn't exist, which is fine

collection = client.create_collection(name="academic_material", embedding_function=google_ef)

# --- 2. THE CLEANING ENGINE (Fixes Symbols) ---
def clean_and_repair_text(text):
    if not text: return ""

    # Map of common broken symbols to clean text
    replacements = {
        "\uf0e0": "->",   # Broken arrow
        "\uf0a7": "->",   # Broken bullet/arrow
        "⇒": "=>",        # Double arrow
        "→": "->",        # Standard arrow
        "∀": "For all",   # Math symbol
        "∃": "There exists",
        "–": "-",         # En-dash
        "“": '"', "”": '"', # Smart quotes
    }
    
    for bad, good in replacements.items():
        text = text.replace(bad, good)

    # Collapse multiple spaces/newlines into single spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# --- 3. THE INGESTION LOGIC ---
def ingest_master(file_path, subject, chapter):
    print(f"📖 Reading {file_path} using pdfplumber...")
    
    full_text = ""
    
    # Step A: Extract & Clean (Page by Page)
    with pdfplumber.open(file_path) as pdf:
        for i, page in enumerate(pdf.pages):
            raw_text = page.extract_text()
            if raw_text:
                cleaned_text = clean_and_repair_text(raw_text)
                full_text += cleaned_text + "\n\n"
            else:
                print(f"   ⚠️ Warning: Page {i+1} appears to be empty or an image.")

    print(f"✅ Extraction complete. Total characters: {len(full_text)}")

    # Step B: Smart Splitting (Recursive)
    # This keeps paragraphs together and respects sentence boundaries
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,   # Large enough for a full concept
        chunk_overlap=200, # Overlap to preserve context between chunks
        separators=["\n\n", "\n", ". ", " ", ""] # Priority list for splitting
    )
    
    chunks = text_splitter.split_text(full_text)
    print(f"✂️  Split text into {len(chunks)} semantic chunks.")

    # Step C: Prepare Data for Database
    documents = []
    metadatas = []
    ids = []

    for i, chunk in enumerate(chunks):
        documents.append(chunk)
        metadatas.append({
            "subject": subject,
            "chapter": chapter,
            "source": os.path.basename(file_path),
            "chunk_index": i
        })
        ids.append(f"{os.path.basename(file_path)}_chunk_{i}")

    # Step D: Batch Upload (Safe Mode)
    BATCH_SIZE = 10
    print("🚀 Starting upload to ChromaDB...")

    for i in range(0, len(documents), BATCH_SIZE):
        batch_docs = documents[i : i + BATCH_SIZE]
        batch_meta = metadatas[i : i + BATCH_SIZE]
        batch_ids = ids[i : i + BATCH_SIZE]
        
        try:
            collection.add(
                documents=batch_docs,
                metadatas=batch_meta,
                ids=batch_ids
            )
            print(f"   💾 Saved batch {i//BATCH_SIZE + 1} / {len(documents)//BATCH_SIZE + 1}")
            time.sleep(1) # Be nice to the API
        except Exception as e:
            print(f"   ❌ Error on batch {i}: {e}")

    print("\n🎉 MASTER INGESTION COMPLETE! Your database is now ready.")

# --- 4. RUN IT ---
# Replace these values with your actual file
if __name__ == "__main__":
    # Example usage:
    ingest_master("ENACh10-Normalization-Modified_Chap15.pdf", subject="DBMS", chapter="Normalization")