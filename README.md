# Personal AI Career Coach for IT Students

## Overview

Personal AI Career Coach for IT Students is a full stack web application that helps computing students understand where they currently stand, what roles they are closest to, and what to work on next.

The system combines structured skills data, role requirements, deterministic recommendation logic, and AI-assisted guidance in one workflow. A student can build a personal skills profile, save academic and career preferences, generate role recommendations, review missing skills, create a multi-week learning plan, ask career-focused questions in chat, and complete mock interviews with AI-generated questions and feedback.

This repository is split into a React frontend and an Express/PostgreSQL backend. In production, the backend serves the built frontend and exposes the API under `/api`.

## What the application does

The application supports five main workflows:

1. **Build a student profile**
   - Register and sign in using cookie-based authentication.
   - Save profile details such as course, year of study, academic focus, interests, preferred technologies, and preferred roles.
   - Add personal skills with a proficiency level from 1 to 5 and optional evidence.

2. **Generate role recommendations**
   - Compare a student’s saved skills against seeded role requirements.
   - Score roles using a weighted competency model.
   - Apply bounded preference bonuses for preferred roles and preferred technologies.
   - Store recommendation runs so results can be revisited later.

3. **Plan skill development**
   - Run a gap analysis against a target role.
   - Classify required skills as matched, partial, or missing.
   - Generate a deterministic learning plan across a selected number of weeks.
   - Save plans as progress entries for later review.

4. **Use AI-assisted coaching**
   - Start and manage chat sessions.
   - Ask career-focused questions with profile and skills passed as context.
   - Receive practical, action-oriented responses rather than long technical tutorials.

5. **Practice interviews**
   - Start mock interviews for a chosen role.
   - Use technical, behavioral, or mixed interview modes.
   - Generate one question at a time and evaluate answers with structured AI feedback.
   - Persist interview history, per-turn feedback, and average session score.

## Core features

### Skills and profile management
- Public skills catalogue with category grouping.
- Authenticated personal skill tracking.
- Profile preferences that influence recommendation ranking.
- Reverse lookup from a skill to roles that require it.

### Recommendation engine
- Deterministic role scoring based on required skill coverage.
- Importance-weighted competency score.
- Separate preference bonus that cannot overpower the base competency score.
- Result caching using a canonical snapshot hash.
- Recommendation history so users can compare runs over time.

### Planner
- Role gap analysis with a readiness percentage.
- Skill-by-skill breakdown of matched, partial, and missing areas.
- Deterministic week planning so repeated generation with the same inputs returns the same plan.
- Saved plans stored in the database.

### Chat
- Multi-session chat history.
- Automatic chat title generation from the first message.
- AI replies grounded in saved profile data and saved skills.
- Fallback response handling when the model returns unusable output.

### Interviews
- Session-based mock interviews.
- Technical, behavioral, and mixed modes.
- AI-generated questions with topic-avoidance based on prior turns.
- AI evaluation stored per answer with rating and written feedback.
- Optional text-to-speech support through ElevenLabs for question narration.

### Frontend experience
- Public landing flow plus authenticated dashboard shell.
- React Router navigation for both public and protected routes.
- MUI-based interface with a custom theme.
- Floating chat shortcut from the dashboard.
- Service worker registration and install prompt handling for PWA-style installation.

## Architecture

### Frontend
The frontend is a React application built with Vite. It uses React Router for navigation, Material UI for the component layer, and a custom theme and CSS layer for the application look and feel. Authentication state is managed in a shared provider, and toast notifications are handled through a dedicated toast provider.

### Backend
The backend is an Express application with PostgreSQL as the primary datastore. It exposes route groups for authentication, skills, profile data, user skills, roles, recommendations, planner operations, chat sessions, and interviews. In production it also serves the built frontend from the `frontend/dist` directory.

### Database
The application uses PostgreSQL tables for:
- users and profiles
- master skills and role skill requirements
- user-specific skill entries
- recommendation runs and recommendation items
- chat sessions and chat messages
- interview sessions and interview turns
- saved progress entries

## Tech stack

### Frontend
- React
- React Router
- Vite
- Material UI
- Recharts
- vite-plugin-pwa

### Backend
- Node.js
- Express
- PostgreSQL with `pg`
- JWT authentication in HttpOnly cookies
- bcrypt password hashing
- OpenAI API integration
- ElevenLabs API integration for interview narration

### Testing and tooling
- Jest for backend tests
- ESLint for frontend linting
- Nodemon for backend development

## Repository layout

The repository is expected to follow a split frontend/backend structure similar to this:

```text
.
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── db.js
│       ├── middleware/
│       ├── routes/
│       └── utils/
├── frontend/
│   ├── package.json
│   └── src/
│       ├── auth/
│       ├── components/
│       ├── pages/
│       ├── toast/
│       ├── styles/
│       └── client.js
├── ai_career_coach.sql
├── lookup_seed.sql
└── README.md
```

## Database schema and seed files

This repository includes multiple SQL files. The recommended setup is:

- `ai_career_coach.sql` for the schema, constraints, triggers, indexes, and foreign keys.
- `lookup_seed.sql` for the current lookup data, including career roles, skills, and role-to-skill requirements.

`export_seed.sql` appears to be an older export and is not needed for the standard local setup if `lookup_seed.sql` is used.

## Local development setup

### Prerequisites

Make sure the following are installed locally:

- Node.js 18+
- npm
- PostgreSQL 15+ or compatible

### 1. Install dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

### 2. Create the database

Create a PostgreSQL database:

```bash
createdb ai_career_coach
```

If you prefer, create it manually in `psql` or a PostgreSQL GUI and use the same name in your environment variables.

### 3. Import the schema

```bash
psql -d ai_career_coach -f ai_career_coach.sql
```

### 4. Import the lookup data

```bash
psql -d ai_career_coach -f lookup_seed.sql
```

### 5. Configure backend environment variables

Create a `.env` file inside `backend/`.

#### Option A: local PostgreSQL settings

```env
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=replace_this_with_a_real_secret
JWT_EXPIRES_IN=7d
COOKIE_NAME=access_token
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_career_coach
DB_USER=postgres
DB_PASSWORD=postgres
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

#### Option B: single connection string

```env
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=replace_this_with_a_real_secret
JWT_EXPIRES_IN=7d
COOKIE_NAME=access_token
DATABASE_URL=postgres://user:password@host:5432/ai_career_coach
DB_SSL=require
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### 6. Start the backend

```bash
cd backend
npm run dev
```

This starts the Express API with Nodemon.

### 7. Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

### 8. Open the app

By default:
- frontend: `http://localhost:5173`
- backend: `http://localhost:3001`

## Running in production

The backend is designed to serve the frontend build in production.

Build the frontend:

```bash
cd frontend
npm run build
```

Start the backend in production mode:

```bash
cd ../backend
npm start
```

With `NODE_ENV=production`, the backend serves the built frontend from `frontend/dist` and exposes the API under the same origin.

## Environment variables

### Required for the backend

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET` | Yes | Signs and verifies authentication tokens. |
| `OPENAI_API_KEY` | Yes for chat/interview AI | Enables OpenAI-powered coaching and interview logic. |
| `PORT` | No | Backend port. Defaults to `3001`. |
| `JWT_EXPIRES_IN` | No | Token and cookie expiry. Defaults to `7d`. |
| `COOKIE_NAME` | No | Auth cookie name. Defaults to `access_token`. |
| `CORS_ORIGIN` | Recommended in development | Allowed frontend origin for local development. |
| `DATABASE_URL` | Yes if not using discrete DB vars | PostgreSQL connection string. |
| `DB_SSL` | No | Enables SSL when needed for hosted databases. |
| `DB_HOST` | Yes if not using `DATABASE_URL` | Local PostgreSQL host. |
| `DB_PORT` | No | Local PostgreSQL port. Defaults to `5432`. |
| `DB_NAME` | Yes if not using `DATABASE_URL` | Database name. |
| `DB_USER` | Yes if not using `DATABASE_URL` | Database user. |
| `DB_PASSWORD` | Yes if not using `DATABASE_URL` | Database password. |
| `OPENAI_MODEL` | No | Model override. Defaults to `gpt-4o-mini`. |
| `ELEVENLABS_API_KEY` | Optional | Enables interview voice listing and TTS narration. |

### Frontend environment variables

No required frontend environment variables were present in the uploaded frontend source. The frontend API client uses relative `/api` paths.

## API surface

The backend exposes these route groups:

- `/api/auth`
- `/api/skills`
- `/api/user-skills`
- `/api/profile`
- `/api/recommendations`
- `/api/roles`
- `/api/chat`
- `/api/planner`
- `/api/interviews`

This README is intentionally high level. Route implementation details belong in dedicated API docs if the project is expanded further.

## Authentication and security notes

- Authentication is cookie-based, not localStorage token-based.
- JWTs are stored in HttpOnly cookies.
- Cookies use `SameSite=Lax`.
- Cookies are marked `secure` only in production.
- Passwords are hashed with bcrypt before storage.
- Protected endpoints are enforced through middleware that reads the JWT from the cookie.

## Recommendation logic

The recommendation engine is not a pure LLM ranker. It is a deterministic scoring system.

At a high level it:
- loads the user’s saved skills
- loads the selected profile preferences
- compares the user’s proficiency levels against each role’s required skills
- computes an importance-weighted competency score
- adds a bounded preference bonus for preferred roles and overlapping preferred technologies
- stores the run and result items for later retrieval
- uses a canonical snapshot hash to return cached results when the exact same inputs are submitted again

The API returns three views:
- best fit
- best fit plus preferences
- preferred roles alignment

## Planner logic

The planner uses role requirements plus current user proficiency to build a gap analysis and generate a structured learning plan.

Each required skill is classified as:
- `matched`
- `partial`
- `missing`

The readiness percentage is calculated as an importance-weighted ratio of current skill level to required skill level, capped at the requirement threshold. Plan generation is deterministic so identical inputs produce identical weekly outputs.

## AI integrations

### Career chat
The chat system sends the last portion of the conversation, the saved student profile, and the student’s saved skills to the OpenAI API. The prompt is intentionally constrained to career guidance and next-step advice rather than code generation.

### Mock interviews
The interview system uses OpenAI twice:
- to generate role-appropriate interview questions
- to evaluate submitted answers and return a numeric rating plus targeted written feedback

In mixed mode, question generation alternates between technical and behavioral prompts.

### Interview narration
If `ELEVENLABS_API_KEY` is set, the interview module can fetch available voices and stream narrated question audio through the ElevenLabs text-to-speech API.

## Testing and quality checks

### Backend tests
The backend package exposes:

```bash
npm test
```

The current automated tests focus on deterministic utility logic, including:
- recommendation scoring and hashing
- planner logic helpers
- OpenAI utility parsing and fallback behavior

### Frontend linting
The frontend package exposes:

```bash
npm run lint
```

### Frontend production build check
You can verify the frontend production build with:

```bash
npm run build
```

## Seeded role catalogue

The current lookup seed includes a broad entry-level role catalogue across:
- frontend and web development
- backend and API development
- QA and test automation
- DevOps and site reliability
- cloud engineering
- security
- mobile development
- data and machine learning
- LLM-enabled application development

This seeded data is what powers role recommendations, skill-to-role lookup, planner gap analysis, and mock interview role selection.

## Notes on local API routing

The frontend API client uses relative `/api` paths. In production that works because the Express server serves both the frontend and API under the same origin.

For local development, your setup should ensure frontend requests to `/api` reach the backend, typically through a Vite dev proxy or an equivalent local reverse-proxy setup.

## Current scope

This project is designed as an academic final-year system with production-style structure rather than a fully productised SaaS platform.

The repository includes core application logic, seeded career data, and deterministic backend tests. It does not currently include separate formal API documentation, CI configuration, containerisation, or infrastructure-as-code in the uploaded source set.

## Summary

This project is not just a chatbot wrapped in a student UI. It is a structured career support application that combines:
- a maintained skills catalogue
- user-owned skill evidence and preferences
- deterministic recommendation and planning logic
- persistent chat and interview workflows
- targeted AI assistance where it adds real value

That combination is what makes the system useful: the AI features sit on top of stored student context and a role/skills data model rather than replacing it.
