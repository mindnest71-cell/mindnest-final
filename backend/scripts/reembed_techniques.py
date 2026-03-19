"""Re-embed all techniques in Supabase using the new gemini-embedding-001 model."""
import sys
import time
sys.path.insert(0, '.')

from app.config import supabase, genai_client
from google.genai import types

def generate_embedding_768(text: str) -> list[float]:
    """Generate a 768-dimensional embedding using gemini-embedding-001."""
    result = genai_client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(
            output_dimensionality=768,
        ),
    )
    return result.embeddings[0].values

# Fetch all techniques
print("Fetching all techniques from Supabase...")
response = supabase.table("techniques").select("id, title, embedding_text").execute()
techniques = response.data

if not techniques:
    print("No techniques found!")
    sys.exit(1)

print(f"Found {len(techniques)} techniques. Re-embedding with gemini-embedding-001...\n")

success = 0
failed = 0

for i, t in enumerate(techniques):
    title = t.get('title', 'Unknown')
    text = t.get('embedding_text', '')
    
    if not text:
        print(f"  [{i+1}/{len(techniques)}] ⚠️  {title} - No embedding_text, skipping")
        failed += 1
        continue
    
    try:
        embedding = generate_embedding_768(text)
        
        # Update the embedding in Supabase
        supabase.table("techniques").update({
            "embedding": embedding
        }).eq("id", t["id"]).execute()
        
        print(f"  [{i+1}/{len(techniques)}] ✅ {title} ({len(embedding)} dims)")
        success += 1
        
        # Small delay to respect rate limits (embedding model: 100 RPM)
        time.sleep(0.7)
        
    except Exception as e:
        print(f"  [{i+1}/{len(techniques)}] ❌ {title} - {str(e)[:80]}")
        failed += 1

print(f"\nDone! Success: {success}, Failed: {failed}")
