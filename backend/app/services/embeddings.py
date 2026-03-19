from app.config import genai_client
from google.genai import types

def generate_embedding(text: str) -> list[float]:
    """
    Generates an embedding for the given text using Gemini's embedding model.
    Output dimensionality is 3072 to match the Supabase vector column.
    """
    try:
        result = genai_client.models.embed_content(
            model="gemini-embedding-001",
            contents=text,
            config=types.EmbedContentConfig(
                output_dimensionality=768,
            ),
        )
        embedding = result.embeddings[0].values
        print(f"[DEBUG] Embedding model: gemini-embedding-001, dimensions: {len(embedding)}")
        return embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return []
