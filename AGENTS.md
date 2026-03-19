# MindNest Agent Guide
# Purpose: orientation for coding agents working in this repo.

## Project Overview
- Monorepo with an Expo React Native frontend and a FastAPI backend.
- Frontend lives in `frontend/` using Expo Router + TypeScript.
- Backend lives in `backend/` using FastAPI + MongoEngine + Supabase.

## Repository Layout
- `frontend/`: Expo app (screens in `app/`, UI in `components/`).
- `backend/`: FastAPI app (routers in `app/routers/`, services in `app/services/`).
- `DEVELOPER_GUIDE.md`: onboarding and runtime instructions.

## Build / Lint / Test Commands

### Frontend (Expo)
Run all commands from `frontend/`.

- Install dependencies: `npm install`
- Start dev server: `npx expo start`
- Start on Android: `npm run android`
- Start on iOS: `npm run ios`
- Start on web: `npm run web`
- Lint: `npm run lint` (runs `expo lint`)

Single test (frontend)
- No unit test runner configured in this repo.
- If adding tests, prefer `jest` and document the command here.

### Backend (FastAPI)
Run all commands from `backend/`.

- Create venv: `python3 -m venv venv`
- Activate venv: `source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`
- Run dev server: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- Docker run (from Dockerfile): `docker build -t mindnest-backend .`

Tests (backend)
- Test file present: `backend/tests/test_api.py`.
- If `pytest` is installed: `python -m pytest`
- Single test: `python -m pytest tests/test_api.py::test_chat_endpoint`
- Test filter: `python -m pytest -k chat_endpoint`

### Notes on Environments
- Backend requires `.env` variables: `SUPABASE_URL`, `SUPABASE_KEY`, `GEMINI_API_KEY`.
- Frontend uses `frontend/utils/api.js` with `TEST_MODE` toggle for locail vs prod.

## Code Style and Conventions

### General
- Prefer clarity over cleverness; keep logic small and composable.
- Use explicit names; avoid single-letter variables outside loops.
- Keep functions focused; move shared logic into helpers or services.
- Favor early returns and guard clauses to reduce nesting.

### Frontend (React Native + Expo)

Imports
- Order imports: React/Expo -> react-native -> third-party -> local.
- Use path alias `@/` for app-local imports (configured in TS).

Components and Hooks
- Function components with hooks; avoid class components.
- Use `useEffect` cleanup functions for subscriptions/timeouts.
- Store UI state locally; store app-wide state in `context/`.

TypeScript
- Prefer `.tsx` for new UI code; use `.ts` for helpers.
- Use explicit prop types and exported types for shared data shapes.
- Avoid `any`; use unions and narrowing instead.

Styling
- Use StyleSheet or inline objects; stay consistent within a file.
- Keep theme values centralized in `frontend/constants/theme.ts`.
- Reference `colors` from `useTheme()` instead of hardcoding colors.

Formatting
- Use single quotes and semicolons (matches current files).
- Keep JSX props on multiple lines when they read better.
- Match existing indentation style in the file you are editing.

Error Handling
- Log errors with context; avoid silent failures.
- For API calls, surface user-friendly messages in the UI.
- Use try/catch around async storage, network, or navigation calls.

### Backend (FastAPI)

Imports
- Standard library -> third-party -> app-local imports.
- Keep imports grouped and sorted within sections.

API Design
- Use `APIRouter` with clear route prefixes.
- Define request/response models with Pydantic.
- Return structured JSON; keep response shape stable.

Types and Data
- Use type hints on public functions and service boundaries.
- Avoid passing raw dicts across layers; use typed objects where practical.

Error Handling
- Use `HTTPException` for expected errors (auth, validation).
- Log unexpected exceptions; return 500 with a safe message.
- Avoid bare `except:`; catch specific exceptions where possible.

Database and Services
- Use `app/services/*` for external integrations (LLM, Supabase, etc.).
- Keep DB writes isolated and wrapped with try/catch.
- Avoid storing secrets in code; rely on `.env`.

Testing
- Tests live in `backend/tests/` and use `TestClient` with mocks.
- Prefer patching external services (`LLM`, `Supabase`, etc.).
- Keep tests deterministic; avoid network calls.

## Cursor / Copilot Rules
- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found.

## Safe Defaults for Agents
- Do not edit `.env` or commit secrets.
- Avoid touching `frontend/utils/api.js` unless asked.
- When adding new commands, update this file.
- Do **not** re-enable per-message severity classification or technique search without explicit instruction — these were intentionally removed.
- Do **not** add auto-save behaviour to the reminder time picker — it must go through the Set Reminder button.

## Quick Pointers
- Frontend routes live in `frontend/app/` (Expo Router).
- Backend entry is `backend/app/main.py`.
- Test mode toggle for API: `frontend/utils/api.js`.
- Global theme state: `frontend/context/theme-context.tsx` — use `useTheme()`.
- Global language state: `frontend/context/language-context.tsx` — use `useLanguage()`.
  - Supported languages: `'en'` | `'th'`.
  - Language is persisted to AsyncStorage under key `app_language`.
  - Both providers are registered in `frontend/app/_layout.tsx`.

## Feature Notes

### Chat / LLM Architecture

**Model**: `gemini-2.5-flash` via `google-generativeai` SDK (file: `backend/app/services/llm.py`).

**Persona**: Calm, emotionally intelligent chat partner — talks like a normal person, NOT a therapist.
- System instruction enforces natural, concise replies (1–3 sentences).
- `_BANNED_OPENINGS` + `_sanitize_opening()` strip scripted openings (e.g. "ขอบคุณที่เปิดใจ") even if the model slips.

**Severity**: Hardcoded to `"LOW"` in `chat.py` for all messages — per-message classification is disabled.
- Technique cards (`techniques`) are always `[]`; cards only appear when the user explicitly requests coping methods.
- Crisis resources (`get_crisis_resources`) are fetched only when severity is `HIGH`/`CRISIS`, which can't occur in normal mode (reserved for future re-enablement).

**Conversation Memory**: `chat.py` fetches the last 10 messages from MongoDB and passes them as `history` to `generate_response()`, which builds a multi-turn Gemini `contents` array (last 8 messages).

**Intent Detection** (Thai only, `llm.py`):
- `detect_intent_th()` returns `"FOOD"` or `"CHAT"` using regex patterns.
- `FOOD` intent: skips emotional support tone, clears history to prevent tone contamination, returns direct food/drink suggestions.

**LLM Timeout**: `asyncio.wait_for(..., timeout=20)` wraps the LLM call in `chat.py`; returns a Thai fallback message on timeout.

**Response format**: Gemini returns JSON `{"text": "...", "quotes": []}`. `chat.py` handles both dict and plain-string fallbacks.

### i18n (Internationalisation)
- Language is controlled globally via `LanguageProvider` in `_layout.tsx`.
- Each screen that needs translated strings should define a `STRINGS` constant:
  ```ts
  const STRINGS = { en: { ... }, th: { ... } };
  // inside component:
  const { lang } = useLanguage();
  const t = STRINGS[lang];
  ```
- The language toggle lives in **Settings → Preferences → Language** (TH / EN chips).
- Do not add per-screen language toggle buttons; use the settings toggle only.

### Mood Tracker
- Screen: `frontend/app/moodtracker.tsx` — accessible from Home → Quick Actions card.
- Users pick a daily mood level (1–5) with emoji: 😢 😔 😐 😊 😄
- Data is stored locally in AsyncStorage under key `mood_history` as a JSON array of `{date, level, emoji, timestamp}`.
- One entry per day; saving again prompts the user to confirm an update.
- The screen shows a **7-day bar chart** (built with plain Views, no charting library) and a scrollable **history list** (last 30 entries).
- Uses `useFocusEffect` to reload data on every navigation to the screen.
- Fully i18n: EN and TH strings defined at the top of the file.

### Daily Reminder Notification
- Users set a notification time in **Settings → Notifications**.
- The time picker does **not** auto-save on change; the user must tap the **Set Reminder** button to save and schedule.
- The scheduled time is persisted to AsyncStorage under keys `daily_reminder_hour` and `daily_reminder_minute`.

### Chat History
- Chat messages are stored in MongoDB (backend) and cached in AsyncStorage under key `chat_history`.
- The chat screen uses `useFocusEffect` (not `useEffect`) to reload history every time the user navigates to the screen, so deletes from Settings are reflected immediately.
- Deleting history clears **both** MongoDB (via `DELETE /chat/history`) **and** the AsyncStorage cache.

### Emergency Call
- Users can save an emergency contact number in **Settings → Emergency Contact**.
- The number is stored in AsyncStorage under key `emergency_contact_number`.
- A red **Emergency Call** button is displayed on the **Home** screen above Quick Actions.
- Tapping it calls `Linking.openURL('tel:<number>')`.
- If no number is saved, an alert prompts the user to go to Settings first.

## Example Workflows

### Run frontend locally with production backend
1. `cd frontend`
2. Ensure `TEST_MODE = false` in `frontend/utils/api.js`.
3. `npm install`
4. `npx expo start`

### Run frontend with local backend
1. `cd backend`
2. `python3 -m venv venv && source venv/bin/activate`
3. `pip install -r requirements.txt`
4. `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
5. `cd frontend`
6. Set `TEST_MODE = true` in `frontend/utils/api.js`.
7. `npx expo start`

### Run backend tests
1. `cd backend`
2. Ensure venv is active
3. `python -m pytest`

## Maintenance Notes
- If you introduce a linting or formatting tool, update commands above.
- Keep this file aligned with `DEVELOPER_GUIDE.md`.
