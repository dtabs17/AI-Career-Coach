# AI Career Coach

A full stack web app for IT students to track skills, maintain a profile, and generate explainable career role recommendations.

Frontend: React (Vite)  
Backend: Node.js + Express  
Database: PostgreSQL  
Auth: JWT stored in an HttpOnly cookie

## What it does
- Register, login, logout (cookie based session)
- Browse a skills library
- Save your own skills with level (1–5) and optional evidence
- Save a profile (academic focus, interests, preferred roles, preferred technologies)
- Run role recommendations using a transparent scoring model:
  - competency score from skill match vs role requirements (weighted)
  - small capped preference bonus as a tie breaker
  - results include matched, partial, and missing skills
  - runs are cached using a hashed input snapshot + algorithm version

## Tech stack
- React + React Router + React Bootstrap
- Node.js + Express
- PostgreSQL (pg)
- bcrypt (password hashing)
- jsonwebtoken + cookie-parser
- cors

## Project structure (high level)

```text
backend/
  src/
    server.js
    db.js
    middleware/auth.js
    routes/
      auth.js
      skills.js
      roles.js
      userSkills.js
      profile.js
      recommendations.js
    utils/hash.js
frontend/
  src/
    api/client.js
    auth/
    components/
    pages/
    styles/
```

## Quick start (paste everything at once)

```bash
# 1) Go to your repo root (edit the path)
cd /path/to/AI_CAREER_COACH

# 2) Install backend dependencies
cd backend
npm install

# 3) Create a backend .env (edit values after it is created)
cat > .env <<'EOF'
PORT=3001
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DB_NAME

JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
COOKIE_NAME=access_token

CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
EOF

# 4) Start backend (uses your scripts if present, falls back to node)
npm run dev || npm start || node src/server.js

# 5) In a new terminal: install frontend dependencies and run frontend
cd ../frontend
npm install
npm run dev || npm start
```

After that:
- Frontend usually runs at http://localhost:5173
- Backend runs at http://localhost:3001

Important:
- Your database must be running and your tables must exist.
- Recommendations require seeded data for skills, career_roles, and role_skills.

## API overview (main routes)
- Auth: /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/me
- Catalogue: /api/skills, /api/roles
- User data (protected): /api/user-skills, /api/profile
- Recommendations (protected): /api/recommendations/run, /api/recommendations/runs, /api/recommendations/runs/:runId

## Notes
- The frontend uses credentials: "include" so cookies are sent with requests.
- The backend CORS config must match your frontend origin (CORS_ORIGIN).
- For production HTTPS, cookie settings should be updated appropriately (secure cookies on HTTPS).
