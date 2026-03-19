"""Test all specified models with a simple prompt to check which ones have available quota."""
import sys
sys.path.insert(0, '.')

from app.config import genai_client

MODELS_TO_TEST = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-exp-image-generation",
    "gemini-2.0-flash-lite-001",
    "gemini-2.0-flash-lite",
    "gemini-exp-1206",
    "gemini-2.5-flash-preview-tts",
    "gemini-2.5-pro-preview-tts",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
]

print("=" * 70)
print(f"{'Model':<45} {'Result'}")
print("=" * 70)

for model_name in MODELS_TO_TEST:
    try:
        response = genai_client.models.generate_content(
            model=model_name,
            contents="Hello how are you",
        )
        text = response.text.strip()[:80]
        print(f"  {model_name:<43} ✅ {text}")
    except Exception as e:
        err_str = str(e)
        if "429" in err_str:
            print(f"  {model_name:<43} ❌ Error 429")
        elif "404" in err_str:
            print(f"  {model_name:<43} ❌ Error 404 (not found)")
        else:
            print(f"  {model_name:<43} ❌ {err_str[:60]}")

print("=" * 70)
