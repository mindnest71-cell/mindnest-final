import sys
import os

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from app.config import supabase
    
    print("Checking database for techniques...")
    
    # Query the techniques table, fetching only the IDs to save bandwidth
    response = supabase.table("techniques").select("id", count="exact").execute()
    
    # Supabase response object has a count attribute when count="exact" is used
    if hasattr(response, 'count') and response.count is not None:
        count = response.count
    else:
        # Fallback if count attribute isn't directly available
        count = len(response.data) if response.data else 0
        
    print(f"\nTotal mental health techniques in database: {count}")
    
    # Let's also check the breakdown by language if the column exists
    try:
        en_response = supabase.table("techniques").select("id", count="exact").eq("language", "en").execute()
        th_response = supabase.table("techniques").select("id", count="exact").eq("language", "th").execute()
        
        en_count = en_response.count if hasattr(en_response, 'count') and en_response.count is not None else len(en_response.data)
        th_count = th_response.count if hasattr(th_response, 'count') and th_response.count is not None else len(th_response.data)
        
        print(f"  - English techniques: {en_count}")
        print(f"  - Thai techniques: {th_count}")
    except Exception as lang_e:
        print(f"\n(Could not retrieve language breakdown: {lang_e})")

except Exception as e:
    print(f"\nError connecting to database or counting techniques: {e}")
