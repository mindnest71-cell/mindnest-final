from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, auth, resources
from app.database import connect_db

app = FastAPI(title="Mind-Nest Backend")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB on startup
@app.on_event("startup")
async def startup_event():
    connect_db()

app.include_router(auth.router)
app.include_router(resources.router)
app.include_router(chat.router)

@app.get("/")
async def root():
    return {"message": "Mind-Nest Backend is running"}
