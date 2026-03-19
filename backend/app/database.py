from mongoengine import connect, Document, StringField, DateTimeField, BooleanField, ReferenceField
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection from environment variable (REQUIRED)
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is required")

def connect_db():
    print("Connecting to MongoDB...")
    try:
        connect(host=MONGO_URI)
        print("MongoDB Connected Successfully")
    except Exception as e:
        print(f"MongoDB Connection Failed: {e}")

# Define the User schema
class User(Document):
    username = StringField(required=True) # Used as Name
    email = StringField(required=True, unique=True)
    password = StringField(required=True)  # Storing plain for now as per original code, can upgrade to hash
    created_at = DateTimeField(default=datetime.now(timezone.utc))
    
    # Security Questions for Forgot Password
    security_question_1 = StringField(required=True)
    security_answer_1 = StringField(required=True)
    security_question_2 = StringField(required=True)
    security_answer_2 = StringField(required=True)

    meta = {'collection': 'users'}

# Define the Chat schema
class Chat(Document):
    user = ReferenceField(User, required=True)
    session_id = StringField(default="default") # For grouping chats
    role = StringField(required=True, choices=["user", "model"]) # Explicit role
    message = StringField(required=True) 
    timestamp = DateTimeField(default=datetime.now(timezone.utc))
    
    # Extra fields for bot responses which might have metadata
    techniques = StringField() 
    crisis_resources = StringField()

    meta = {
        'collection': 'chats',
        'ordering': ['timestamp']
    }
