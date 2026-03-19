# MindNest Developer Guide

A simple guide for teammates to run and navigate the project.

---

## 📱 1. Running the Frontend (Expo)

### Prerequisites
- Node.js installed
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Steps

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (first time only)
npm install

# Start the development server
npx expo start
```

A QR code will appear in your terminal.

**On your phone:**
- **iOS**: Open Camera app → scan QR code → tap the link
- **Android**: Open Expo Go app → tap "Scan QR code"

> ⚠️ Your phone and computer must be on the **same WiFi network**

---

## 🔄 2. Switching Between Local and Production Backend

Open `frontend/utils/api.js` and find this section at the top:

```javascript
// TEST_MODE: 
//   true  = Use local development server (localhost)
//   false = Use Railway production server
const TEST_MODE = false;
```

| Mode | `TEST_MODE` | Backend URL |
|------|-------------|-------------|
| **Production** (Railway) | `false` | `https://mindnest-production-a1a7.up.railway.app` |
| **Local Testing** | `true` | `localhost:8000` |

### Running Local Backend

If `TEST_MODE = true`, you need to run the backend locally:

```bash
# Navigate to backend folder
cd backend

# Create virtual environment (first time only)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Mac/Linux
# or
.\venv\Scripts\activate  # Windows

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will run at `http://localhost:8000`

> **Note**: Make sure you have a `.env` file in the backend folder with required environment variables (ask team lead for the values).

---

## 📂 3. Navigating the Codebase

### Project Structure

```
MindNest_Unified/
├── frontend/                 # React Native (Expo) App
│   ├── app/                  # Screens (Expo Router)
│   │   ├── index.tsx         # Login screen
│   │   ├── signup.tsx        # Registration screen
│   │   ├── home.tsx          # Main dashboard
│   │   ├── chat.tsx          # AI Chat screen
│   │   ├── resources.tsx     # Self-help resources
│   │   └── settings.tsx      # User settings
│   ├── components/           # Reusable UI components
│   │   ├── ChatInput.js      # Message input box
│   │   ├── MessageBubble.js  # Chat message display
│   │   └── ChatHeader.js     # Chat screen header
│   └── utils/
│       └── api.js            # API configuration (TEST_MODE here!)
│
├── backend/                  # FastAPI Backend
│   ├── app/
│   │   ├── main.py           # Entry point, CORS, startup
│   │   ├── database.py       # MongoDB models (User, Chat)
│   │   ├── routers/
│   │   │   ├── auth.py       # Login, Register, Password Reset
│   │   │   ├── chat.py       # AI Chat, History
│   │   │   └── resources.py  # Self-help resources
│   │   └── services/
│   │       ├── llm.py        # Gemini AI integration
│   │       ├── embeddings.py # Text embeddings
│   │       └── retrieval.py  # Supabase vector search
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile            # For Railway deployment
│   └── .env                  # Environment variables (DO NOT COMMIT)
│
└── DEVELOPER_GUIDE.md        # This file!
```

### Key Files to Know

| File | What it does |
|------|--------------|
| `frontend/utils/api.js` | API URL config, switch between local/production |
| `backend/app/main.py` | FastAPI app entry point |
| `backend/app/database.py` | MongoDB connection and data models |
| `backend/app/routers/chat.py` | Main chat logic with AI |
| `backend/app/services/llm.py` | Gemini AI response generation |

---

## 🗄️ Databases

| Database | Used For | Access |
|----------|----------|--------|
| **MongoDB** | Users, Chat History | MongoDB Atlas (cloud) |
| **Supabase** | Techniques, Resources (vector search) | Supabase Dashboard |

---

## 🚀 Deployment

- **Backend**: Hosted on [Railway](https://railway.app) - auto-deploys on push to `main`
- **Frontend**: Use Expo Go for testing, or build APK with EAS for distribution

---

## ❓ Common Issues

### "Network Error" on phone
- Make sure `TEST_MODE = false` (use Railway) **OR**
- If `TEST_MODE = true`, ensure your phone is on the same WiFi as your computer

### Backend won't start locally
- Check if `.env` file exists with `MONGO_URI`, `GEMINI_API_KEY`, etc.
- Make sure virtual environment is activated (`source venv/bin/activate`)

### Changes not showing in app
- Shake your phone → "Reload" 
- Or press `r` in the Expo terminal

---

## 👥 Team Contacts

- Backend issues: [Add contact]
- Frontend issues: [Add contact]
- Deployment: [Add contact]
