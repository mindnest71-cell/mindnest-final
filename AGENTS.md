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
- Frontend uses `frontend/utils/api.js` with `TEST_MODE` toggle for local vs prod.

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

## Quick Pointers
- Frontend routes live in `frontend/app/` (Expo Router).
- Backend entry is `backend/app/main.py`.
- Test mode toggle for API: `frontend/utils/api.js`.

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
