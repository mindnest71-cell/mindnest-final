from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import User
import bcrypt

router = APIRouter(prefix="/auth", tags=["auth"])

def verify_password(plain_password, hashed_password):
    # hashed_password from DB is string, needs to be bytes
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    # Returns bytes, need to decode to utf-8 string for storage
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    name: str 
    email: str
    password: str
    security_question_1: str
    security_answer_1: str
    security_question_2: str
    security_answer_2: str

class ForgotPasswordRequest(BaseModel):
    email: str

class SecurityQuestionsRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    security_answer_1: str
    security_answer_2: str
    new_password: str

@router.post("/register")
async def register(request: SignupRequest):
    # Check if user exists
    existing_user = User.objects(email=request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        hashed_pw = get_password_hash(request.password)
        hashed_ans_1 = get_password_hash(request.security_answer_1.lower().strip()) # Hash answers for security
        hashed_ans_2 = get_password_hash(request.security_answer_2.lower().strip())

        user = User(
            username=request.name,
            email=request.email,
            password=hashed_pw,
            security_question_1=request.security_question_1,
            security_answer_1=hashed_ans_1,
            security_question_2=request.security_question_2,
            security_answer_2=hashed_ans_2
        )
        user.save()
        return {"message": "User registered successfully", "user_id": str(user.id)}
    except Exception as e:
        print(f"Register Error: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login")
async def login(request: LoginRequest):
    user = User.objects(email=request.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if not verify_password(request.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    return {
        "message": "Login successful",
        "user_id": str(user.id),
        "name": user.username,
        "email": user.email
    }

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    # Stub for now
    user = User.objects(email=request.email).first()
    # Logic to send email would go here
    return {"message": "If email exists, reset link sent"}

@router.post("/security-questions")
async def get_security_questions(request: SecurityQuestionsRequest):
    user = User.objects(email=request.email).first()
    if not user:
        # distinct error for now to help UI, though security-wise generic is better usually
        raise HTTPException(status_code=404, detail="Email not found")
    
    return {
        "question_1": user.security_question_1,
        "question_2": user.security_question_2
    }

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    user = User.objects(email=request.email).first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
    
    # Verify Answers
    if not verify_password(request.security_answer_1.lower().strip(), user.security_answer_1):
        raise HTTPException(status_code=400, detail="Answer 1 is incorrect")
    
    if not verify_password(request.security_answer_2.lower().strip(), user.security_answer_2):
        raise HTTPException(status_code=400, detail="Answer 2 is incorrect")
    
    # Update Password
    user.password = get_password_hash(request.new_password)
    user.save()
    
    return {"message": "Password reset successfully"}
    
class ChangePasswordRequest(BaseModel):
    user_id: str
    old_password: str
    new_password: str

@router.post("/change-password")
async def change_password(request: ChangePasswordRequest):
    user = User.objects(id=request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Verify Old Password
    if not verify_password(request.old_password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    # Update to New Password
    user.password = get_password_hash(request.new_password)
    user.save()
    
    return {"message": "Password updated successfully"}

def get_current_user_id(authorization: str):
    if not authorization:
        return None
    try:
        scheme, param = authorization.split()
        if scheme.lower() != 'bearer':
            return None
        return param
    except:
        return None

from fastapi import Header
from app.database import Chat

@router.delete("/me")
async def delete_account(authorization: str = Header(None)):
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    user = User.objects(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete User's Chats
    Chat.objects(user=user).delete()
    
    # Delete User
    user.delete()
    
    return {"message": "Account deleted successfully"}

