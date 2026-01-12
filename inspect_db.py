import chromadb
from chromadb.utils import embedding_functions
import os
from dotenv import load_dotenv

# 1. Load Setup
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# 2. Connect to the DB
client = chromadb.PersistentClient(path="./student_ai_db")
google_ef = embedding_functions.GoogleGenerativeAiEmbeddingFunction(
    api_key=GOOGLE_API_KEY,
    model_name="models/text-embedding-004"
)
collection = client.get_collection(name="academic_material", embedding_function=google_ef)

# 3. Peek at the data (Get the first 5 items)
data = collection.peek(limit=46)

print(f"📊 Total documents in DB: {collection.count()}")
print("-" * 30)

if data['documents']:
    for i, doc in enumerate(data['documents']):
        print(f"📄 Document {i+1} Preview:")
        print(doc[:200]) # Print first 200 characters
        print(f"Sources: {data['metadatas'][i]}")
        print("-" * 30)
else:
    print("⚠️ The database is EMPTY!")