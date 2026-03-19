from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from app.services.retrieval import get_crisis_resources
from app.services.llm import generate_response
from app.database import Chat, User
from datetime import datetime, timezone
import traceback
import asyncio

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    severity: str
    techniques: list = []
    crisis_resources: list = []
    quotes: list = []

def detect_language(text: str) -> str:
    for char in text:
        if '\u0E00' <= char <= '\u0E7F':
            return 'th'
    return 'en'

def get_current_user_id(authorization: str = Header(None)):
    if not authorization:
        return None
    try:
        # Expected format: "Bearer <user_id>"
        scheme, param = authorization.split()
        if scheme.lower() != 'bearer':
            return None
        return param
    except:
        return None

@router.get("/chat/history")
async def get_chat_history(authorization: str = Header(None)):
    user_id = get_current_user_id(authorization)
    if not user_id:
        return [] # Return empty if no auth, or raise 401

    try:
        user = User.objects(id=user_id).first()
    except Exception as e:
        print(f"Failed to fetch user/history from DB: {e}")
        return []
    if not user:
        return []

    # Fetch last 50 messages
    try:
        chats = Chat.objects(user=user).order_by('timestamp').limit(50)
    except Exception as e:
        print(f"Failed to fetch chats from DB: {e}")
        return []
    
    history = []
    for chat in chats:
        history.append({
            "id": str(chat.id),
            "text": chat.message,
            "isUser": chat.role == "user",
            "timestamp": chat.timestamp.strftime("%I:%M %p"),
            "timestamp_iso": chat.timestamp.isoformat(),
            "date": chat.timestamp.date().isoformat(),
            "techniques": [], # Could store these if needed
            "crisis_resources": [],
            "severity": "", 
            "quotes": []
        })
    return history

@router.delete("/chat/history")
async def delete_chat_history(authorization: str = Header(None)):
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        user = User.objects(id=user_id).first()
    except Exception as e:
        print(f"Failed to resolve user during delete history: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        Chat.objects(user=user).delete()
    except Exception as e:
        print(f"Failed to delete chat history from DB: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")
    return {"message": "Chat history deleted"}

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, authorization: str = Header(None)):
    try:
        user_id = get_current_user_id(authorization)
        user = None
        if user_id:
            try:
                user = User.objects(id=user_id).first()
            except Exception as user_lookup_error:
                # Treat invalid/malformed auth token as anonymous instead of failing the chat endpoint.
                print(f"Failed to resolve user from Authorization header: {user_lookup_error}")
                user = None

        # 1. Detect Language
        language = detect_language(request.message)
        
        # 2. Normal conversational mode (no per-message severity classification)
        # Keep response shape stable for frontend while avoiding an extra LLM call.
        severity = "LOW"
        
        # 3. Technique cards disabled for normal conversational mode
        techniques = []
        
        # 4. Get Crisis Resources (if needed)
        crisis_info = []
        if severity in ["HIGH", "CRISIS"]:
            crisis_info = get_crisis_resources(language=language)
            
        # 5. Fetch recent chat history for conversation memory
        chat_history = []
        if user:
            try:
                recent_chats = Chat.objects(user=user).order_by('-timestamp').limit(10)
                chat_history = [
                    {"role": c.role, "text": c.message}
                    for c in reversed(list(recent_chats))
                ]
            except Exception as e:
                print(f"Failed to fetch chat history: {e}")

        # 6. Generate Response
        context = ""

        try:
            llm_output = await asyncio.wait_for(
                asyncio.to_thread(
                    generate_response,
                    request.message,
                    context,
                    severity,
                    crisis_info,
                    language,
                    chat_history,
                ),
                timeout=20,
            )
        except asyncio.TimeoutError:
            print("LLM response timed out after 20s; returning fallback response")
            llm_output = {
                "text": "ขออภัย ตอนนี้ตอบช้ากว่าปกติ ลองส่งใหม่อีกครั้งได้ไหม?",
                "quotes": [],
            }
        
        # Handle case where llm_output might be a string (fallback) or dict
        if isinstance(llm_output, str):
             bot_response = llm_output
             quotes = []
        else:
             bot_response = llm_output.get("text", "")
             quotes = llm_output.get("quotes", [])
             
        # --- SAVE TO MONGODB ---
        if user:
            try:
                # Save User Message
                Chat(
                    user=user,
                    role="user",
                    message=request.message,
                    timestamp=datetime.now(timezone.utc)
                ).save()
                
                # Save Bot Response
                Chat(
                    user=user,
                    role="model",
                    message=bot_response,
                    timestamp=datetime.now(timezone.utc),
                    techniques=str(techniques) if techniques else "",
                    crisis_resources=str(crisis_info) if crisis_info else ""
                ).save()
            except Exception as db_e:
                print(f"Failed to save chat to DB: {db_e}")
        
        return ChatResponse(
            response=bot_response,
            severity=severity,
            techniques=techniques,
            crisis_resources=crisis_info,
            quotes=quotes
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
