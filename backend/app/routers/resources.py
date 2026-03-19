from fastapi import APIRouter, HTTPException, Query
from app.config import supabase

router = APIRouter(prefix="/resources", tags=["resources"])

@router.get("/")
async def get_resources(language: str = Query("en", description="Filter resources by language code (en, th)")):
    try:
        # Fetch resources from Supabase where 'language' matches
        response = supabase.table("crisis_resources").select("*").eq("language", language).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching resources: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch resources")
