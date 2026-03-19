"""Check the dimensions of embeddings stored in Supabase."""
import sys
sys.path.insert(0, '.')
from app.config import supabase

print("Checking stored embedding dimensions...")
response = supabase.table("techniques").select("id, title, embedding").limit(1).execute()
if response.data:
    row = response.data[0]
    emb = row.get('embedding')
    if isinstance(emb, list):
        print(f"  Stored embedding dimension: {len(emb)}")
    elif isinstance(emb, str):
        # might be a string representation
        import json
        try:
            parsed = json.loads(emb)
            print(f"  Stored embedding dimension: {len(parsed)}")
        except:
            print(f"  Embedding is a string, first 100 chars: {emb[:100]}")
    else:
        print(f"  Embedding type: {type(emb)}, value: {str(emb)[:100]}")
else:
    print("  No data found")
