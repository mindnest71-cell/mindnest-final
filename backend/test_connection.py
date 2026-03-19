import os
from dotenv import load_dotenv
import socket
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print(f"URL: {SUPABASE_URL}")

try:
    print("Attempting to connect via Supabase Client...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Try an RPC call that we know exists or just a health check
    # The app uses 'match_techniques', let's try calling it with dummy data
    # Or just select from 'techniques' table limit 1
    print("Selecting from 'techniques' table...")
    response = supabase.table("techniques").select("id").limit(1).execute()
    print(f"Network request successful! Data: {response.data}")
except Exception as e:
    print(f"Network request failed: {e}")
