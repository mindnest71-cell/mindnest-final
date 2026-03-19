import google.generativeai as genai
import json
import re

# -------------------- Models --------------------

SEVERITY_CLASSIFIER = genai.GenerativeModel("gemini-2.5-flash")

CHAT_SYSTEM_INSTRUCTION = """You are a calm, emotionally intelligent chat partner.
You talk like a normal person in everyday chat — natural, casual, and real.

You understand psychology, but you DO NOT speak like a therapist/psychiatrist.
No scripted empathy, no formal counseling language.

Rules:
- Keep replies concise (1–3 short sentences).
- Sound natural and human.
- Only ask a question if it feels natural in chat. It's okay to ask none.
- Do NOT start with phrases like "ขอบคุณที่..." or "Thank you for sharing".
- Do NOT say "your feelings are valid" / "ความรู้สึกของคุณถูกต้อง" explicitly.
- Do NOT diagnose or prescribe medication.
- No bullet points, no headers.
"""

CHAT_MODEL = genai.GenerativeModel(
    "gemini-2.5-flash",
    system_instruction=CHAT_SYSTEM_INSTRUCTION
)

# -------------------- Helpers --------------------

def is_thai_text(s: str) -> bool:
    """Detect Thai characters so we don't rely on FE language flag."""
    return bool(re.search(r"[\u0E00-\u0E7F]", s or ""))

# -------------------- Intent detection (TH) --------------------

def detect_intent_th(message: str) -> str:
    """
    Minimal rule-based intent router.
    Returns: "FOOD" or "CHAT"
    """
    m = (message or "").strip().lower()

    # Food / drink recommendation intent
    food_patterns = [
        r"เครียด.*กินอะไร",
        r"เครียด.*กินไร",
        r"กินอะไร.*ดี",
        r"กินไร.*ดี",
        r"กินไรวันนี้",
        r"กินอะไรวันนี้",
        r"แนะนำ.*(อาหาร|ของกิน|เมนู)",
        r"อยากกินอะไร",
        r"หิว.*กินอะไร",
        r"หิว.*กินไร",
        r"(อาหาร|ของกิน|เมนู).*แก้เครียด",
        r"เครียด.*ดื่มอะไร",
        r"เครียด.*ดื่มไร",
        r"ดื่มอะไร.*ดี",
        r"ดื่มไร.*ดี",
        r"แนะนำ.*เครื่องดื่ม",
    ]
    if any(re.search(p, m) for p in food_patterns):
        return "FOOD"

    return "CHAT"

# -------------------- Severity --------------------

def classify_severity(message: str) -> str:
    prompt = f"""Classify the mental health severity of this message. Respond with ONLY one word.

LOW: Greetings, casual chat, everyday talk, venting lightly, mild tiredness, general curiosity, asking about the app, small daily frustrations that aren't distressing
MODERATE: Noticeable anxiety, persistent sadness, significant work stress, relationship problems, feeling overwhelmed or unmotivated
HIGH: Severe distress, panic attacks, hopelessness, feeling unable to function, serious emotional crisis
CRISIS: Thoughts of self-harm, suicidal ideation, immediate danger to self or others

When in doubt between LOW and MODERATE, prefer LOW for conversational messages.

Message: "{message}"

Classification:"""

    try:
        response = SEVERITY_CLASSIFIER.generate_content(prompt)
        severity = (response.text or "").strip().upper()
        if severity not in ["LOW", "MODERATE", "HIGH", "CRISIS"]:
            return "MODERATE"
        return severity
    except Exception as e:
        print(f"Error classifying severity: {e}")
        return "MODERATE"

# -------------------- Output guardrails --------------------

_BANNED_OPENINGS = (
    "ขอบคุณที่",
    "ขอบคุณนะ",
    "ขอบคุณที่เล่า",
    "ขอบคุณที่แชร์",
    "ดีใจที่คุณ",
    "ขอบคุณที่เปิดใจ",
    "thank you for sharing",
    "thanks for sharing",
)

def _sanitize_opening(text: str) -> str:
    """Remove therapist-y opening if model slips into it."""
    t = (text or "").strip()
    low = t.lower()
    for b in _BANNED_OPENINGS:
        if low.startswith(b.lower()):
            t2 = re.sub(r"^[^\n。.!?…]*[。.!?…]?\s*", "", t).strip()
            return t2 if t2 else t
    return t

# -------------------- Main response generation --------------------

def generate_response(
    message: str,
    context: str,
    severity: str,
    crisis_info: list,
    language: str = 'en',
    history: list = None
) -> dict:
    if history is None:
        history = []

    language_instruction = (
        "ตอบเป็นภาษาไทยเท่านั้น" if is_thai_text(message) else "Respond in English only."
    )

    # ✅ Intent routing: do NOT rely on FE language flag
    intent = "CHAT"
    if is_thai_text(message):
        intent = detect_intent_th(message)

    # ✅ If intent is FOOD, force a practical mode (also helps FE if it uses severity)
    if intent == "FOOD":
        severity = "LOW"
        history = []  # prevent copying therapist tone from previous turns

    # Safety note only when needed (and not FOOD)
    severity_note = ""
    if severity in ["HIGH", "CRISIS"] and intent != "FOOD":
        severity_note = (
            "User is in significant distress. Be calm and grounded. "
            "Do NOT mention phone numbers or resource names — they appear automatically in cards."
        )

    quotes_note = (
        'Include 3 short uplifting quotes in the "quotes" array.'
        if severity == "CRISIS"
        else 'Leave "quotes" as an empty list.'
    )

    # ✅ FIX: Do NOT inject technique/coping block when intent is FOOD
    technique_block = ""
    if context and context.strip() and intent != "FOOD":
        technique_block = f"""User asked for coping techniques. You may mention 1–2 technique NAMES only (no steps; steps appear in cards):
{context.strip()}"""

    # Style guard per intent
    if intent == "FOOD" and is_thai_text(message):
        style_guard = (
            "ตอบแบบแชทปกติ และให้คำตอบที่ใช้งานได้จริง\n"
            "ผู้ใช้ถามหาอาหาร/เครื่องดื่ม ให้แนะนำเมนูตรงๆ 4–6 อย่าง\n"
            "เขียนเป็นประโยคเดียว คั่นด้วยจุลภาค (,) ห้ามทำ bullet/หัวข้อ\n"
            "ไม่ต้องปลอบใจยาว ไม่ต้องสอนใจ ไม่ต้องตีความเรื่องความเครียด\n"
            "ถ้าจะถามต่อ ให้ถามแค่ 1 คำถามสั้นๆ เช่น อยากได้แบบเผ็ด/หวาน/ของอุ่น หรือแพ้อะไรไหม"
        )
    else:
        style_guard = (
            "Write like normal chat (not therapist).\n"
            "Do NOT start with \"ขอบคุณที่...\" or similar.\n"
            "Avoid formal counseling phrases. Keep it natural."
        )

    current_prompt = f"""{language_instruction}

{style_guard}

{technique_block}

{severity_note}

Reply in this exact JSON format — nothing else:
{{"text": "your response", "quotes": []}}
{quotes_note}

User message: {message}

Important:
- If the user asks what to eat/drink → give food/drink suggestions directly.
- Do NOT give motivational speeches for FOOD-like questions.
"""

    # Build multi-turn contents from history (last 8 messages)
    contents = []
    for msg in history[-8:]:
        role = "user" if msg.get("role") == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg.get("text", "")}]})

    contents.append({"role": "user", "parts": [{"text": current_prompt}]})

    try:
        response = CHAT_MODEL.generate_content(contents)
        text_response = (response.text or "").strip()

        # Clean code fences if model adds them
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.startswith("```"):
            text_response = text_response[3:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]

        result = json.loads(text_response.strip())

        # Post-process: prevent banned openings if it slips
        if isinstance(result, dict) and "text" in result:
            result["text"] = _sanitize_opening(result["text"])

        # Ensure quotes key exists
        if isinstance(result, dict) and "quotes" not in result:
            result["quotes"] = []

        # Optional: debug (uncomment temporarily)
        # print("DEBUG:", {"msg": message, "intent": intent, "severity": severity, "ctx_len": len(context or "")})

        return result

    except Exception as e:
        print(f"Error generating response: {e}")

        # Fallbacks
        if is_thai_text(message) and intent == "FOOD":
            fallback_text = (
                "ลองกินของอุ่นๆ สบายท้องนะ เช่น โจ๊ก/ข้าวต้ม, ก๋วยเตี๋ยวน้ำใส, ซุป, ชาบูน้ำซุป, "
                "ชาอุ่นๆ หรือโกโก้ร้อน—อยากได้แบบเผ็ดหรือไม่เผ็ด?"
            )
            return {"text": fallback_text, "quotes": []}

        fallback_text = "เล่าเพิ่มได้ไหม ตอนนี้เป็นยังไงบ้าง?"
        fallback_quotes = []
        if severity in ["HIGH", "CRISIS"]:
            fallback_text = "ผมอยู่นี่นะ ลองดูทรัพยากรช่วยเหลือด้านล่างได้เลย คุณไม่จำเป็นต้องเจอเรื่องนี้คนเดียว"
            fallback_quotes = [
                "You are stronger than you know.",
                "This too shall pass.",
                "You are not alone."
            ]

        return {"text": fallback_text, "quotes": fallback_quotes}