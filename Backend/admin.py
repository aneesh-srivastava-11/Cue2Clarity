import os
import requests
import sys
from dotenv import load_dotenv

# 1. Load the .env file
load_dotenv()

# ⚙️ CONFIGURATION
API_URL = "http://127.0.0.1:8000"

# 2. Get password from .env (just like main.py does)
ADMIN_PASSWORD = os.getenv("ADMIN_SECRET")

if not ADMIN_PASSWORD:
    print("❌ Error: ADMIN_SECRET not found in .env file.")
    sys.exit(1)

def delete_topic():
    print("\n🗑️  DELETE TOPIC")
    subject = input("Enter the EXACT Subject name to delete: ").strip()
    if not subject: return

    confirm = input(f"⚠️  Are you sure you want to delete all notes for '{subject}'? (yes/no): ")
    if confirm.lower() != "yes": return

    try:
        response = requests.delete(
            f"{API_URL}/admin/delete-topic",
            headers={"x-admin-secret": ADMIN_PASSWORD},
            json={"subject": subject}
        )
        
        if response.status_code == 200:
            print(f"✅ Success: {response.json()['message']}")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

def nuke_system():
    print("\n☢️  NUKE SYSTEM (DELETE EVERYTHING)")
    print("This will wipe ALL Pinecone vectors and Supabase files.")
    
    confirm = input("Type 'DELETE_EVERYTHING' to confirm: ").strip()
    if confirm != "DELETE_EVERYTHING":
        print("❌ Cancelled.")
        return

    try:
        response = requests.delete(
            f"{API_URL}/admin/nuke-system",
            headers={"x-admin-secret": ADMIN_PASSWORD},
            json={"confirmation": "DELETE_EVERYTHING"}
        )
        
        if response.status_code == 200:
            print(f"✅ Success: {response.json()['message']}")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")

    except Exception as e:
        print(f"❌ Connection Failed: {e}")

# --- MENU LOOP ---
if __name__ == "__main__":
    # Ensure requests is installed
    try:
        import requests
    except ImportError:
        print("❌ You need to install 'requests' library first: pip install requests")
        sys.exit(1)

    while True:
        print("\n" + "═"*40)
        print("🔧 ADMIN REMOTE CONTROL")
        print("═"*40)
        print("1. 🗑️  Delete Specific Topic")
        print("2. ☢️  NUKE SYSTEM (Reset All)")
        print("3. ❌ Exit")
        
        choice = input("\nSelect option: ").strip()
        
        if choice == "1":
            delete_topic()
        elif choice == "2":
            nuke_system()
        elif choice == "3":
            print("Bye!")
            break
        else:
            print("Invalid option")