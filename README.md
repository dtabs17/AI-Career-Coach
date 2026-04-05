# Personal AI Career Coach for IT Students

Personal AI Career Coach for IT Students is my final year project. It is a full stack web application built to help IT students understand where they currently stand, which entry-level roles fit their current skill set, and what they should work on next.

The project does not treat career support as just a chatbot problem. It combines structured skills data, stored student preferences, seeded role requirements, deterministic scoring, and targeted AI assistance in one workflow. The recommendation engine is explainable and repeatable. AI is used where natural language interaction adds real value, mainly career coaching chat and mock interview generation and feedback.

## Live Demo

https://aicareercoach.dev

## Overview

A user can:

- create an account and sign in with cookie-based authentication
- build a profile with course details, academic focus, interests, preferred roles, and preferred technologies
- add skills with a self-rated proficiency level from 1 to 5 and optional evidence
- browse a public skills library and see which roles use a skill
- generate role recommendations based on their saved profile and skills
- review matched, partial, and missing skills for each recommended role
- run a gap analysis for a selected role
- generate and save a multi-week learning plan
- ask career-focused questions in chat with saved profile and skills used as context
- complete mock interviews with AI-generated questions and answer feedback
- revisit saved recommendation runs, chat sessions, interview sessions, and learning plans

## Why this project exists

Many students know bits of programming, tools, and frameworks, but still struggle to answer simple career questions like:

- What junior roles actually fit what I know right now?
- What am I missing for the roles I want?
- What should I learn next, in a realistic order?
- How do I talk about my skills confidently in interviews?

A lot of career advice tools stay too generic. They either give broad motivational advice or rely too heavily on opaque AI output. This project takes a different approach. It stores structured skill and role data in PostgreSQL, scores roles with deterministic logic, and then uses AI only where conversation and written feedback are genuinely helpful.

## Main design choices

### Deterministic recommendations first

The recommendation engine compares a student's saved skills against seeded role requirements. It uses an importance-weighted competency score, then applies bounded preference bonuses for preferred roles and preferred technologies. That means the ranking is explainable, repeatable, and not dominated by vague AI reasoning.

### AI used selectively

AI is not used to decide everything in the app. It is used for:

- career coaching chat
- mock interview question generation
- mock interview answer evaluation

This keeps the most important matching logic transparent while still using AI where it can genuinely improve the user experience.

### Persistent workflows

This is not a one-off calculator. The application stores:

- user profiles
- user skills
- recommendation runs
- saved learning plans
- chat sessions and messages
- interview sessions and interview turns

That gives the project continuity and makes it feel like a real student support tool rather than a demo.

### Same-origin production architecture

In production, the backend serves the built frontend and exposes the API under `/api`. This avoids unnecessary cross-origin complexity and works well with JWT authentication stored in HttpOnly cookies.

## Tech stack

### Frontend

- React
- Vite
- React Router
- Material UI
- Recharts
- vite-plugin-pwa

### Backend

- Node.js
- Express
- PostgreSQL with `pg`
- JWT authentication in HttpOnly cookies
- bcrypt password hashing
- Jest for backend tests

### External services

- OpenAI API for chat replies, interview question generation, and interview answer evaluation
- ElevenLabs API for interview question narration

## Architecture

The project follows a simple three-part structure:

### Presentation layer

The frontend is a React single-page application. Public pages such as Home, Skills, Login, and Register are available without authentication. Authenticated users get a dashboard shell with protected pages for My Skills, Profile, Recommendations, Recommendation History, Chat, Planner, and Interviews.

### Application layer

The backend is an Express application that exposes route groups for:

- authentication
- skills
- user skills
- profile
- recommendations
- roles
- chat
- planner
- interviews

### Data layer

PostgreSQL stores both seeded lookup data and user-generated data. Core tables include:

- `users`
- `profiles`
- `skills`
- `career_roles`
- `role_skills`
- `user_skills`
- `recommendation_runs`
- `recommendation_items`
- `chat_sessions`
- `chat_messages`
- `interview_sessions`
- `interview_turns`
- `progress_entries`

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/dtabs17/AI-Career-Coach.git
cd AI-Career-Coach
```

### 2. Install dependencies

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

### 3. Create a PostgreSQL database

Create a local PostgreSQL database for the project. The exact command depends on how PostgreSQL is installed on your machine, but a typical CLI example looks like this:

```bash
createdb ai_career_coach
```

If you prefer pgAdmin, create a new database there instead.

### 4. Load the schema and seed data

From the project root, load the schema file first and the lookup seed second.

```bash
psql -d ai_career_coach -f ai_career_coach.sql
psql -d ai_career_coach -f lookup_seed.sql
```

What each file does:

- `ai_career_coach.sql` creates the schema, constraints, indexes, triggers, and foreign keys
- `lookup_seed.sql` loads the lookup data used by the app, mainly roles, skills, and role-to-skill mappings

### 5. Create the backend `.env` file

Create a `.env` file inside the `backend` folder.

Example:

```env
PORT=3001
NODE_ENV=development

JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
COOKIE_NAME=access_token

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_career_coach
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

CORS_ORIGIN=http://localhost:5173

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

Notes:

- You can use `DATABASE_URL` instead of the individual `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` values if you prefer a single connection string.
- `DB_SSL` is mainly useful when connecting to managed PostgreSQL services that require SSL.
- `COOKIE_NAME` falls back to `access_token` if you do not set it.
- `JWT_EXPIRES_IN` falls back to `7d` if you do not set it.
- `OPENAI_MODEL` falls back to `gpt-4o-mini` if you do not set it.
- `CORS_ORIGIN` is only needed for local development.
- The current frontend codebase does not require a separate frontend `.env` file.

### 6. Run the backend

From the `backend` folder:

```bash
npm run dev
```

This starts the Express server on port `3001` by default.

### 7. Run the frontend

Open a second terminal and start the frontend from the `frontend` folder:

```bash
npm run dev
```

The frontend uses the Vite dev server and proxies `/api` requests to `http://localhost:3001`.

### 8. Start using the app

A sensible first run looks like this:

1. Register a new account
2. Add skills in **My Skills**
3. Complete **Profile**
4. Run **Recommendations**
5. Use **Planner** for a target role
6. Try **Chat** and **Mock Interviews**

## Available scripts

### Backend

From the `backend` folder:

```bash
npm run dev
```

Starts the backend in development mode with Nodemon.

```bash
npm start
```

Starts the backend normally.

```bash
npm test
```

Runs the backend Jest test suite.

### Frontend

From the `frontend` folder:

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Builds the production frontend into `frontend/dist`.

```bash
npm run preview
```

Previews the production frontend build locally.

```bash
npm run lint
```

Runs the frontend ESLint checks.

## Core features

### 1. Skill-based role recommendations

The recommendations feature is built around structured role requirements and user skill data.

Each recommendation run:

- reads the user's saved skills
- reads profile preferences such as preferred roles and preferred technologies
- compares the user's skills against every seeded role
- calculates an importance-weighted competency score
- applies a bounded preference bonus
- stores the run and item breakdown in the database
- returns multiple ranked views of the results

The current recommendation views are:

- **Best fit**: ranked by raw competency score only
- **Best fit + preferences**: ranked by competency score plus preference bonus
- **Preferred roles**: preferred roles ranked by how close the user currently is

Each recommended role includes an explanation showing:

- matched skills
- partial matches
- missing skills
- total required skills
- preference overlap information

### 2. Gap analysis and learning planner

The planner feature helps the user move from where they are now to a specific target role.

It works in two steps:

1. **Gap analysis** compares the selected role's required skills against the user's saved skills and classifies each requirement as matched, partial, or missing.
2. **Plan generation** builds a multi-week learning plan focused only on missing and partial skills.

Each plan includes:

- role title
- gap summary
- week-by-week plan items
- estimated effort per item
- suggested tasks
- suggested evidence the student could collect
- saved plan history

Plans are stored in the database and can be reopened or deleted later.

### 3. Career coaching chat

The chat feature is not just a blank prompt box.

When the assistant generates a reply, it is grounded in:

- the student's saved profile
- the student's saved skills
- recent chat history

Chat sessions are stored in the database, messages are persisted, and the first user message is used to generate a short session title automatically.

The backend also protects against duplicate assistant replies on the same chat session by using a PostgreSQL advisory lock during message processing.

### 4. Mock interviews

The interviews feature lets a user practise role-specific interviews inside the app.

A user can:

- select a role
- choose **technical**, **behavioral**, or **mixed** mode
- choose between 3 and 10 questions
- answer each question in sequence
- receive AI-generated feedback and a rating for each answer
- review the full transcript after completion

Completed sessions store:

- the role
- the mode
- the total question count
- each interview turn
- the user's answers
- AI ratings
- AI feedback
- final average score

Interview question audio playback is also supported through ElevenLabs text-to-speech.

## Recommendation scoring summary

The scoring model is intentionally simple and explainable.

For each required skill in a role:

- the user's proficiency level is compared against the required level
- the result is capped so over-qualification does not earn extra points
- the score contribution is weighted by skill importance

This produces a weighted competency percentage from 0 to 100.

Preference bonuses are then added on top:

- preferred role match bonus: up to **+6**
- preferred technology overlap bonus: up to **+4**
- combined bonus cap: **+10**

This keeps preferences useful without letting them overpower the underlying skill match.

## Authentication and security notes

Authentication is implemented with JWTs stored in HttpOnly cookies.

Current security-related design choices include:

- passwords are hashed with `bcryptjs`
- JWTs are stored in HttpOnly cookies instead of local storage
- cookies use `SameSite=Lax`
- cookies are marked `Secure` in production
- protected routes use authentication middleware
- several routes enforce ownership checks so users can only access their own data
- the frontend always sends authenticated requests with `credentials: "include"`

This project reduces common client-side token exposure risks by avoiding token storage in browser-accessible JavaScript state. It does not currently implement a separate CSRF token mechanism.

## API route summary

The backend exposes these main route groups:

- `/api/auth`
- `/api/skills`
- `/api/user-skills`
- `/api/profile`
- `/api/recommendations`
- `/api/roles`
- `/api/chat`
- `/api/planner`
- `/api/interviews`

These routes support the full application workflow from account creation to saved recommendations, chat, learning plans, and interview practice.

## Database notes

The database schema includes:

- relational core entities for users, roles, skills, and user skill profiles
- foreign key relationships and constraints
- triggers for `updated_at` maintenance
- indexes for common lookups
- a unique recommendation run cache key using user ID, input hash, and algorithm version

The lookup data is seeded separately from user-generated data. This makes it easier to reuse the application structure while changing or expanding the role and skill catalogue later.

## Testing

The backend currently includes automated Jest tests for the most important pure logic and utility areas:

- `openai_utils.test.js`
- `planner_logic.test.js`
- `scoring.test.js`

These tests cover things like:

- fallback handling for malformed AI output
- deterministic planner behavior
- recommendation scoring correctness
- bounded score and bonus logic
- repeatable snapshot hashing

Run the tests from the `backend` folder:

```bash
npm test
```

## PWA support

The frontend includes Progressive Web App support through `vite-plugin-pwa`.

The Vite configuration includes:

- manifest metadata
- standalone display mode
- icons
- service worker registration
- runtime caching rules for selected assets and API requests

This allows the app to behave more like an installable web app on supported devices and browsers.

## Project structure

A simplified view of the repository looks like this:

```text
AI-Career-Coach/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── __tests__/
│   │   ├── db.js
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── toast/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── vite.config.js
│   └── package.json
├── ai_career_coach.sql
├── lookup_seed.sql
└── README.md
```

## Current limitations

This project is functional, but there are still limitations.

- Skill levels are self-reported by the user.
- Recommendation quality depends on the quality and coverage of the seeded role-skill mappings.
- AI feedback quality depends on the external model and prompt behavior.
- There is no separate CSRF token mechanism at the moment.
- The app is focused on IT students and entry-level technical roles rather than the full wider job market.
- The current automated tests focus on backend logic rather than full end-to-end browser flows.

## Possible future improvements

Some realistic next steps for the project would be:

- add admin tooling for managing roles, skills, and role-skill mappings in the UI
- add stronger analytics on skill progression over time
- add end-to-end frontend tests
- add richer evidence tracking for user skills
- add export features for plans, recommendations, or interview reports
- expand the seeded role catalogue further
- add more evaluation and guardrail tooling for AI-generated responses

## Author

**David Adebanwo**