
import sys
import os

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import GEMINI_API_KEY
import google.generativeai as genai

print(f"GEMINI_API_KEY present: {bool(GEMINI_API_KEY)}")

try:
    from app.services.embeddings import generate_embedding
    print("Imported generate_embedding successfully")
    
    text = "Hello world"
    print(f"Testing embedding generation for: '{text}'")
    
    embedding = generate_embedding(text)
    
    if embedding:
        print(f"Success! Embedding length: {len(embedding)}")
    else:
        print("Failed: Embedding is empty/None")
        
except Exception as e:
    print(f"Error during test: {e}")
