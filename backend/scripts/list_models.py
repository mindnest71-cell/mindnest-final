"""List all available Gemini models for your API key."""
import sys
sys.path.insert(0, '.')

from app.config import genai_client

print("=" * 60)
print("Available Gemini Models")
print("=" * 60)

for model in genai_client.models.list():
    print(f"  {model.name}")

print("=" * 60)
