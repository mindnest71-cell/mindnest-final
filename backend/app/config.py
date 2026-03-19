import os
from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is not set")
if not SUPABASE_KEY:
    raise ValueError("SUPABASE_KEY is not set")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Create a single genai Client for use across all services
genai_client = genai.Client(api_key=GEMINI_API_KEY)
