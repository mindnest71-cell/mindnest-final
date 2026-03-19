"""Test technique retrieval from Supabase to debug empty results."""
import sys
sys.path.insert(0, '.')

from app.services.embeddings import generate_embedding
from app.services.retrieval import search_techniques
from app.config import supabase

# Step 1: Check if techniques table has data
print("=" * 60)
print("Step 1: Check techniques table")
print("=" * 60)
try:
    response = supabase.table("techniques").select("id, title, language").limit(5).execute()
    if response.data:
        print(f"  Found {len(response.data)} techniques (showing first 5):")
        for t in response.data:
            print(f"    - [{t.get('language','?')}] {t.get('title','?')}")
    else:
        print("  ⚠️  No techniques found in the table!")
except Exception as e:
    print(f"  ❌ Error: {e}")

# Step 2: Check what columns exist
print("\n" + "=" * 60)
print("Step 2: Check table columns")
print("=" * 60)
try:
    response = supabase.table("techniques").select("*").limit(1).execute()
    if response.data:
        print(f"  Columns: {list(response.data[0].keys())}")
    else:
        print("  No data to check columns")
except Exception as e:
    print(f"  ❌ Error: {e}")

# Step 3: Generate embedding and search
print("\n" + "=" * 60)
print("Step 3: Generate embedding for 'I am feeling anxious'")
print("=" * 60)
embedding = generate_embedding("I am feeling anxious")
print(f"  Embedding length: {len(embedding)}")

if embedding:
    print("\n" + "=" * 60)
    print("Step 4: Search techniques with embedding")
    print("=" * 60)
    techniques = search_techniques(embedding, language='en', match_count=5)
    if techniques:
        print(f"  Found {len(techniques)} matching techniques:")
        for t in techniques:
            print(f"    - {t.get('title', '?')} (similarity: {t.get('similarity', '?')})")
    else:
        print("  ⚠️  No techniques returned!")
        
        # Try with lower threshold  
        print("\n  Retrying with lower threshold (0.1)...")
        techniques2 = search_techniques(embedding, language='en', match_threshold=0.1, match_count=5)
        if techniques2:
            print(f"  Found {len(techniques2)} with lower threshold:")
            for t in techniques2:
                print(f"    - {t.get('title', '?')} (similarity: {t.get('similarity', '?')})")
        else:
            print("  ⚠️  Still no results. The RPC function or embedding column may be incompatible.")

print("\n" + "=" * 60)
