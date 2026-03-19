from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from app.services.embeddings import generate_embedding
from app.services.retrieval import search_techniques, get_crisis_resources
from app.services.llm import classify_severity, generate_response
from app.database import Chat, User
from datetime import datetime, timezone

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
    # Simple heuristic: check for Thai unicode range
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
    
    user = User.objects(id=user_id).first()
    if not user:
        return []

    # Fetch last 50 messages
    chats = Chat.objects(user=user).order_by('timestamp').limit(50)
    
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
    
    user = User.objects(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    Chat.objects(user=user).delete()
    return {"message": "Chat history deleted"}

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, authorization: str = Header(None)):
    try:
        user_id = get_current_user_id(authorization)
        user = None
        if user_id:
            user = User.objects(id=user_id).first()

        # 1. Detect Language
        language = detect_language(request.message)
        
        # 2. Classify Severity
        severity = classify_severity(request.message)
        
        # 3. Generate Embedding
        embedding = generate_embedding(request.message)
        if not embedding:
            raise HTTPException(status_code=500, detail="Failed to generate embedding")
        
        # 4. Search Techniques
        techniques = search_techniques(embedding, language=language, match_count=5)
        
        # 5. Get Crisis Resources (if needed)
        crisis_info = []
        if severity in ["HIGH", "CRISIS"]:
            crisis_info = get_crisis_resources(language=language)
            
        # 6. Generate Response
        # Format context from techniques
        context = ""
        for t in techniques:
            context += f"Technique: {t['title']}\nDescription: {t['content']}\nInstructions: {t['instructions']}\n\n"
            
        llm_output = generate_response(request.message, context, severity, crisis_info, language=language)
        
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
        raise HTTPException(status_code=500, detail=str(e))
