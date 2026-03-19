import google.generativeai as genai
from app.config import GEMINI_API_KEY

def generate_embedding(text: str) -> list[float]:
    """
    Generates an embedding for the given text using Gemini's text-embedding-004 model.
    """
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_query"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return []
