# Personal AI Career Coach for IT Students

## Overview

Personal AI Career Coach for IT Students is a full stack web application built to help computing students understand where they currently stand, which entry-level roles align with their current skill set, and what they should work on next.

The application combines structured skills data, seeded role requirements, deterministic recommendation logic, and AI-assisted guidance in a single workflow. Users can build a personal skills profile, store career preferences, generate role recommendations, review missing skills, create a multi-week development plan, ask career-focused questions in chat, and complete mock interviews with AI-generated questions and feedback.

The project is organised as a React frontend and an Express/PostgreSQL backend. In production, the backend serves the built frontend and exposes the API under `/api`.

## What the application does

The application supports five core workflows:

1. **Profile and skills setup**
   - Register and sign in with cookie-based authentication.
   - Save profile data such as course, year of study, academic focus, interests, preferred technologies, and preferred roles.
   - Add personal skills with a proficiency level from 1 to 5 and optional evidence.

2. **Role recommendations**
   - Compare saved user skills against seeded role requirements.
   - Score roles using a deterministic, importance-weighted competency model.
   - Apply bounded preference bonuses for preferred roles and preferred technologies.
   - Store recommendation runs so results can be revisited later.

3. **Skill-gap planning**
   - Run a gap analysis against a selected target role.
   - Classify required skills as matched, partial, or missing.
   - Generate a deterministic learning plan across a selected number of weeks.
   - Save generated plans for later review.

4. **AI-assisted career coaching**
   - Start and manage chat sessions.
   - Ask career-focused questions with saved profile and skills passed as context.
   - Receive practical, action-oriented responses instead of long generic explanations.

5. **Mock interviews**
   - Start interview sessions for a selected role.
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
- Importance-weighted competency scoring.
- Preference bonuses that support ranking without overpowering the base competency score.
- Result caching using a canonical input snapshot hash.
- Recommendation history so users can compare runs over time.

### Planner
- Role gap analysis with a readiness percentage.
- Skill-by-skill breakdown of matched, partial, and missing areas.
- Deterministic week planning so repeated generation with the same inputs returns the same plan.
- Saved plans stored in the database.

### Chat
- Multi-session chat history.
- Automatic chat title generation from the first user message.
- AI replies grounded in saved profile data and saved skills.
- Fallback handling when the model response is empty or unusable.

### Interviews
- Session-based mock interviews.
- Technical, behavioral, and mixed modes.
- AI-generated questions with topic-avoidance based on prior turns.
- AI evaluation stored per answer with rating and written feedback.
- Optional text-to-speech support through ElevenLabs for question narration.

### Frontend experience
- Public landing flow plus authenticated dashboard shell.
- React Router navigation for public and protected routes.
- MUI-based interface with a custom theme.
- Floating chat shortcut from the dashboard.
- Service worker registration and install prompt handling for PWA-style installation.

## Architecture

### Frontend
The frontend is a React application built with Vite. It uses React Router for navigation, Material UI for the component layer, and a custom theme and CSS layer for the application look and feel. Authentication state is managed in a shared provider, and toast notifications are handled through a dedicated toast provider.

### Backend
The backend is an Express application backed by PostgreSQL. It exposes route groups for authentication, skills, profile data, user skills, roles, recommendations, planner operations, chat sessions, and interviews. In production it also serves the compiled frontend from the `frontend/dist` directory.

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

The repository uses a split frontend/backend layout:

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

## Database files

The SQL files in the repository serve different purposes:

- `ai_career_coach.sql` contains the schema, constraints, indexes, triggers, and foreign keys.
- `lookup_seed.sql` contains the lookup data required by the application, including `career_roles`, `skills`, and `role_skills`.

For a fresh local setup, import `ai_career_coach.sql` first and `lookup_seed.sql` second.

## Local development setup

### Prerequisites

Install the following before starting:

- Node.js 18 or newer
- npm
- PostgreSQL

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

You can also create the database in pgAdmin or another PostgreSQL GUI, as long as the database name matches your environment configuration.

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

#### Option A: discrete local PostgreSQL settings

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
DATABASE_URL=postgres://postgres:postgres@localhost:5432/ai_career_coach
PGSSLMODE=disable
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### 6. Start the backend

```bash
cd backend
npm run dev
```

### 7. Start the frontend

```bash
cd frontend
npm run dev
```

By default, the frontend runs on Vite's development server and the backend listens on port `3001`.

## Scripts

### Backend scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the backend with Nodemon |
| `npm start` | Start the backend with Node |
| `npm test` | Run the backend Jest test suite |

### Frontend scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Production run

Build the frontend first:

```bash
cd frontend
npm run build
```

Then start the backend in production mode:

```bash
cd backend
NODE_ENV=production npm start
```

In production mode, the backend serves the compiled frontend and also exposes the API routes.

## API overview

This is the main application surface exposed by the backend.

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Skills and profile
- `GET /api/skills`
- `GET /api/skills/:id/roles`
- `GET /api/user-skills`
- `POST /api/user-skills`
- `DELETE /api/user-skills/:skillId`
- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/roles`

### Recommendations
- `POST /api/recommendations/run`
- `GET /api/recommendations/runs`
- `GET /api/recommendations/runs/:runId`

### Planner
- `GET /api/planner/gap/:roleId`
- `POST /api/planner/plan`
- `GET /api/planner/plans`
- `GET /api/planner/plans/:id`
- `DELETE /api/planner/plans/:id`

### Chat
- `GET /api/chat/sessions`
- `POST /api/chat/sessions`
- `PATCH /api/chat/sessions/:sessionId`
- `DELETE /api/chat/sessions/:sessionId`
- `GET /api/chat/sessions/:sessionId/messages`
- `POST /api/chat/sessions/:sessionId/messages`

### Interviews
- `GET /api/interviews/sessions`
- `POST /api/interviews/sessions`
- `GET /api/interviews/sessions/:id`
- `POST /api/interviews/sessions/:id/answer`
- `DELETE /api/interviews/sessions/:id`
- `GET /api/interviews/voices`
- `POST /api/interviews/tts`

## Authentication and security notes

- Authentication is cookie-based rather than localStorage token-based.
- The backend sets the JWT inside an HttpOnly cookie.
- `SameSite=Lax` is used by default.
- Cookies are marked `Secure` in production.
- Passwords are hashed with bcrypt before storage.
- Authenticated frontend requests include credentials.

## Recommendation engine notes

The recommendation pipeline is designed to be explainable and stable:

- it scores each role against saved user skills and required role skills
- it applies profile-based preference bonuses separately from the raw competency score
- it stores recommendation runs and items so results can be revisited later
- it caches repeated runs using an input snapshot hash and algorithm version

This keeps recommendation ranking deterministic and reviewable while still allowing AI features elsewhere in the product.

## Testing and code quality

The current repository scripts support:

- backend Jest tests via `npm test`
- frontend linting via `npm run lint`
- frontend production build verification via `npm run build`

The current backend test suite covers core pure-logic areas such as:

- recommendation scoring
- planner logic
- OpenAI response parsing utilities

## Notes for maintainers

- The frontend and backend are intentionally coupled around relative `/api` paths.
- The backend supports both `DATABASE_URL` deployments and local multi-variable PostgreSQL configuration.
- The interview TTS route currently uses a fixed ElevenLabs voice ID for a consistent question-reading experience.
- Planner data is persisted in `progress_entries` using the `learning_plan` type discriminator.

## Project status

This repository contains the working application, not a starter scaffold or template. The main setup requirement is a valid PostgreSQL schema plus the seeded role and skill data. Once those are in place, the frontend, API, recommendation engine, planner, chat, and interview flows run as one connected system.
