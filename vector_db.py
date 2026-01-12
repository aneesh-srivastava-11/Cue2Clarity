import chromadb
import os
from chromadb.utils import embedding_functions
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
# Ensure you have set the GOOGLE_API_KEY in your .env file

# 1. Initialize the Client (Local Mode)
# This saves the database to a folder named "student_ai_db" on your computer
client = chromadb.PersistentClient(path="./student_ai_db")

# 2. Set up the Embedding Function
# Chroma needs to know WHICH model to use to turn text into numbers.
# We use the Google Generative AI embedding function.
google_ef = embedding_functions.GoogleGenerativeAiEmbeddingFunction(
    api_key=GOOGLE_API_KEY,
    model_name="models/text-embedding-004" # Using the model recommended in your doc [cite: 45]
)

# 3. Create (or get) a Collection
# Think of a "Collection" like a Table in SQL.
collection = client.get_or_create_collection(
    name="academic_material",
    embedding_function=google_ef
)

# 4. Add Documents (Ingestion)
# We add the text chunks along with the critical metadata 
collection.add(
    documents=[
        "Normalization is the process of organizing data in a database.",
        "The Third Normal Form (3NF) requires that all attributes are only dependent on the primary key.",
        "Newton's Second Law states that Force equals mass times acceleration (F=ma)."
    ],
    metadatas=[
        {"subject": "DBMS", "chapter": "Normalization", "doc_type": "textbook"},
        {"subject": "DBMS", "chapter": "Normalization", "doc_type": "lecture_note"},
        {"subject": "Physics", "chapter": "Dynamics", "doc_type": "textbook"}
    ],
    ids=["doc1", "doc2", "doc3"] # Unique IDs for each chunk
)

print("✅ Documents ingested successfully!")

results = collection.query(
    query_texts=["Tell me about database forms"], 
    n_results=2, # Retrieve top 2 matches
    where={"subject": "DBMS"} # Optional: Filter ONLY for DBMS content [cite: 58]
)

print(results['documents'])
# Output will likely be the two DBMS notes, ignoring the Physics note.