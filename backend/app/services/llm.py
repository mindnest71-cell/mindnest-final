import json
from google.genai import types
from app.config import genai_client
from app.services.fallback_responses import get_keyword_fallback

SYSTEM_INSTRUCTION = """
You are Mind-Nest, a warm, empathetic, and supportive mental wellness companion.
Your goal is to provide actionable, non-medical mental health advice based on the provided context.

Guidelines:
- Be empathetic and validating. Acknowledge the user's feelings first.
- Use the provided context (techniques) to offer specific advice.
- If you recommend a technique from the context, simply introduce it and explain WHY it is helpful.
- CRITICAL: DO NOT write out the step-by-step instructions in your response. The instructions will be shown to the user in a separate card automatically. Just mention the technique name clearly.
- If the context is empty, offer general supportive advice but mention you are still learning.
- NEVER diagnose conditions or prescribe medication.
- NEVER give medical advice.
- Keep responses concise and easy to read.
"""


def classify_severity(message: str) -> str:
    """
    Classifies the severity of the user's message.
    """
    prompt = f"""Classify this message's mental health severity. Respond with ONLY one word.

LOW: Mild stress, general questions, curiosity
MODERATE: Anxiety, sadness, work stress, relationship issues
HIGH: Severe distress, panic attacks, hopelessness, can't function
CRISIS: Self-harm thoughts, suicidal ideation, immediate danger

Message: "{message}"

Classification:"""

    try:
        response = genai_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        severity = response.text.strip().upper()
        if severity not in ["LOW", "MODERATE", "HIGH", "CRISIS"]:
            return "MODERATE"
        return severity
    except Exception as e:
        print(f"Error classifying severity: {e}")
        return "MODERATE"


def generate_response(message: str, context: str, severity: str, crisis_info: list, language: str = 'en') -> dict:
    """
    Generates a supportive response using Gemini, returning a structured dict.
    """
    
    language_instruction = ""
    if language == 'th':
        language_instruction = "IMPORTANT: Please respond in Thai language (ภาษาไทย)."
    else:
        language_instruction = "Please respond in English."

    prompt_parts = [
        f"User Message: {message}",
        f"Detected Severity: {severity}",
        f"Relevant Techniques Context:\n{context}",
        language_instruction,
        "IMPORTANT: You must return your response in valid JSON format: {\"text\": \"Your response text...\", \"quotes\": [\"Quote 1\", \"Quote 2\", \"Quote 3\"]}. If no quotes are needed, return an empty list for quotes.",
        "IMPORTANT: In your 'text' response, mention at most 2 techniques from the context. Briefly explain why they help, but do NOT list steps. Refer the user to the cards below for more details."
    ]
    
    if severity == "MODERATE":
        prompt_parts.append("IMPORTANT: The user is feeling moderate distress. Suggest the provided techniques as helpful tools. Be empathetic and supportive.")

    elif severity in ["HIGH", "CRISIS"]:
        prompt_parts.append("CRITICAL: The user is in distress. Be extremely gentle, validating, and prioritize safety. Your response should be purely empathetic and supportive. IMPORTANT: Do NOT list any phone numbers or resource names in your text. The user will see them in the cards below. Just gently urge them to use the resources provided below.")
        
        if severity == "CRISIS":
             prompt_parts.append("ALSO: Generate 3 short, uplifting, and appropriate quotes for this situation to help the user feel a bit better. Include them in the 'quotes' array of the JSON response.")

    full_prompt = "\n\n".join(prompt_parts)
    
    try:
        response = genai_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
            ),
        )
        # Clean up potential markdown code blocks
        text_response = response.text.strip()
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
        
        return json.loads(text_response)
    except Exception as e:
        print(f"Error generating response: {e}")
        
        fallback_quotes = []
        
        # HIGH/CRISIS always gets the safety-first response
        if severity in ["HIGH", "CRISIS"]:
            fallback_text = "I hear how much pain you're in right now. Please, reach out to the support numbers below. You don't have to go through this alone."
            fallback_quotes = [
                "You are stronger than you know.",
                "This too shall pass.",
                "You are not alone."
            ]
        else:
            # Keyword-based contextual fallback with randomized responses
            fallback_text = get_keyword_fallback(message, language)
            
        return {
            "text": fallback_text,
            "quotes": fallback_quotes
        }