from app.config import supabase

def search_techniques(query_embedding: list[float], language: str = 'en', match_threshold: float = 0.35, match_count: int = 4):
    """
    Searches for relevant techniques using the match_techniques RPC function.
    """
    try:
        # Convert embedding list to string format for Supabase
        embedding_str = f"[{','.join(str(x) for x in query_embedding)}]"
        
        response = supabase.rpc(
            "match_techniques",
            {
                "query_embedding": embedding_str,
                "match_threshold": match_threshold,
                "match_count": match_count,
                "filter_language": language
            }
        ).execute()
        return response.data
    except Exception as e:
        print(f"Error searching techniques: {e}")
        return []

def get_crisis_resources(language: str = 'en'):
    """
    Fetches crisis resources filtered by language, prioritizing 24/7 availability.
    """
    try:
        response = supabase.table("crisis_resources").select("*").eq("language", language).execute()
        resources = response.data
        
        # Sort: 24/7 resources first
        def is_24_7(res):
            hours = res.get('available_hours', '').lower()
            return '24/7' in hours or '24 ชั่วโมง' in hours

        resources.sort(key=lambda x: not is_24_7(x)) # False (is_24_7) comes before True, so we negate
        
        return resources
    except Exception as e:
        print(f"Error fetching crisis resources: {e}")
        return []