import os
from dotenv import load_dotenv
import google.generativeai as genai

# 1. Load Environment
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

print(f"🔑 API Key Loaded: {'Yes' if api_key else 'NO'}")
if not api_key:
    print("❌ STOP: You are missing the GOOGLE_API_KEY in your .env file.")
    exit()

genai.configure(api_key=api_key)

# 2. Test Listing Models (Checks connection)
print("\n📡 Connecting to Google Servers...")
try:
    print("✅ Connection successful.")
except Exception as e:
    print(f"❌ Connection Failed: {e}")
    exit()

# 3. Test Text Generation (Gemini Pro)
print("\n🤖 Testing Gemini Generation...")
try:
    # Trying the safest model first
    model = genai.GenerativeModel('models/gemini-2.5-flash-lite') 
    response = model.generate_content("Say 'Hello'")
    print(f"✅ Generation Success: {response.text}")
except Exception as e:
    print(f"❌ Generation Failed: {e}")

# 4. Test Embeddings (This is likely where your app crashes!)
print("\n🧠 Testing Embeddings...")
try:
    result = genai.embed_content(
        model="models/text-embedding-004",
        content="Test",
        task_type="retrieval_document"
    )
    print("✅ Embedding Success")
except Exception as e:
    print(f"❌ Embedding Failed: {e}")
    print("💡 FIX: Your library might be too old for 'text-embedding-004'.")