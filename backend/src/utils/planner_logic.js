function safeNum(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function statusOrder(status) {
  if (status === "missing") return 0;
  if (status === "partial") return 1;
  return 2;
}

/**
 * Computes a 32-bit FNV-1a hash of a string and returns it as an unsigned integer.
 *
 * The constants 2166136261 (offset basis) and 16777619 (prime) are defined by
 * the FNV-1a specification. Used by pickMany to derive a stable numeric seed
 * from a string so that identical inputs always produce identical task selections.
 *
 * @param {string} str - Input string to hash.
 * @returns {number} Unsigned 32-bit integer hash.
 */
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Selects up to `count` unique items from `list` using a deterministic seed
 * derived from `seedStr`.
 *
 * The selection is intentionally deterministic: the same skill name, role, and
 * week number always produce the same suggestions. This ensures that re-generating
 * a plan with identical inputs returns an identical result, preventing confusing
 * changes when a user views or regenerates the same plan.
 *
 * @param {string[]} list - Pool of candidate strings to pick from.
 * @param {number} count - Number of unique items to select.
 * @param {string} seedStr - Seed string used to derive a stable starting index.
 * @returns {string[]} Array of up to `count` unique items from `list`.
 */
function pickMany(list, count, seedStr) {
  const arr = Array.isArray(list) ? list.filter(Boolean) : [];
  if (!arr.length) return [];
  const out = [];
  const used = new Set();
  const seed = hashString(seedStr);

  for (let i = 0; i < count && used.size < arr.length; i++) {
    let idx = (seed + i * 101) % arr.length;
    let tries = 0;
    while (tries < arr.length && used.has(arr[idx])) {
      idx = (idx + 1) % arr.length;
      tries++;
    }
    const item = arr[idx];
    if (!used.has(item)) {
      used.add(item);
      out.push(item);
    }
  }
  return out;
}


function normalizeSkillName(name) {
  return String(name || "").trim();
}

function presetForSkill(skillName) {
  const presets = [
    {
      match: /(openapi|swagger|api design)/i,
      learn: [
        "Study resource naming, versioning, and consistent URL patterns",
        "Read up on error models (problem+json), status codes, and pagination conventions",
        "Write an OpenAPI spec for 2 endpoints (request, response, errors)",
      ],
      build: [
        "Design endpoints for a small feature (create, list, update) with clear request/response shapes",
        "Create an OpenAPI (Swagger) spec file and validate it",
        "Implement a consistent error response wrapper across endpoints",
      ],
      quality: [
        "Add request validation (schema) and return helpful 400 messages",
        "Add pagination or filtering to a list endpoint",
        "Add a Postman collection for the feature",
      ],
      evidence: [
        "OpenAPI spec (yaml/json) + screenshots from Swagger UI",
        "Postman collection export + README examples",
        "Before/after: inconsistent endpoints fixed into a clean design",
      ],
    },
    {
      match: /(rest|restful)/i,
      learn: [
        "Review REST constraints, idempotency, and correct use of verbs and status codes",
        "Learn pagination patterns (limit/offset, cursor), filtering, sorting",
        "Review authentication patterns for REST APIs (cookie JWT vs header JWT)",
      ],
      build: [
        "Build a CRUD set of endpoints with proper status codes and error handling",
        "Add filtering and sorting to a list endpoint",
        "Add pagination to a list endpoint and document it",
      ],
      quality: [
        "Add integration tests for 2 endpoints",
        "Add rate limiting or basic abuse protection (even simple)",
        "Add structured logging for requests and failures",
      ],
      evidence: [
        "Postman collection demonstrating CRUD + pagination",
        "Integration tests (supertest) with passing output screenshot",
        "Short API docs section in README with examples",
      ],
    },
    {
      match: /(environment|env|dotenv|config)/i,
      learn: [
        "Learn config layering: defaults, env vars, and per-environment overrides",
        "Review secrets handling: never commit secrets, use .env.example",
        "Understand runtime config validation (fail fast on missing vars)",
      ],
      build: [
        "Add a config module that reads env vars and validates required keys",
        "Add .env.example and update README setup instructions",
        "Add safe fallbacks for dev while enforcing required vars in prod",
      ],
      quality: [
        "Add a startup check that prints a friendly error for missing config",
        "Add different configs for dev vs prod (without changing code)",
        "Add a small health endpoint showing config-loaded status (no secrets)",
      ],
      evidence: [
        ".env.example + config validation code + README setup section",
        "Screenshot of app failing fast with missing vars, then passing after fix",
        "Commit diff showing secrets removed and config centralized",
      ],
    },
    {
      match: /(postgres|sql|database|queries|joins)/i,
      learn: [
        "Review indexing basics and query planning at a high level",
        "Learn transactional patterns (BEGIN/COMMIT/ROLLBACK)",
        "Review normalization and safe query practices",
      ],
      build: [
        "Add 2 useful indexes and justify them with query usage",
        "Refactor one N+1 query pattern into a join",
        "Add a transaction for a multi-step write operation",
      ],
      quality: [
        "Add input validation to prevent bad writes",
        "Add basic migration script or schema note",
        "Add a query performance note (what index helps and why)",
      ],
      evidence: [
        "SQL migration/index script + explanation",
        "Before/after query example with join refactor",
        "Commit link showing transaction usage",
      ],
    },
    {
      match: /(jwt|auth|authentication|authorization|cookies)/i,
      learn: [
        "Review JWT claims (sub, exp), refresh patterns, and cookie flags",
        "Review access control: role checks, ownership checks",
        "Review common auth pitfalls (CSRF, XSS exposure, token expiry)",
      ],
      build: [
        "Add route-level authorization checks (ownership) on a protected resource",
        "Add refresh or expiry handling (force re-login on expiry)",
        "Add audit logging for login/logout",
      ],
      quality: [
        "Add tests for unauthenticated and unauthorized access cases",
        "Set cookie flags correctly (HttpOnly, SameSite, Secure where appropriate)",
        "Add consistent 401/403 responses",
      ],
      evidence: [
        "Tests showing 401 vs 403 cases",
        "Short security note in README (cookie flags, expiry, CSRF stance)",
        "Commit link implementing ownership checks",
      ],
    },
    {
      match: /(testing|unit test|integration test|jest|supertest)/i,
      learn: [
        "Review what to unit test vs integration test",
        "Learn how to mock external dependencies cleanly",
        "Review test data setup and teardown patterns",
      ],
      build: [
        "Add 5 unit tests for pure logic functions",
        "Add 2 integration tests hitting real routes",
        "Add a test helper for DB setup/cleanup",
      ],
      quality: [
        "Add CI test script in package.json",
        "Add coverage threshold (even small)",
        "Add one negative test case per endpoint (bad input)",
      ],
      evidence: [
        "Test output screenshot + coverage report snippet",
        "Commit link adding test suite and scripts",
        "README section: how to run tests",
      ],
    },
  ];

  return presets.find((p) => p.match.test(skillName)) || null;
}

function tasksFor(skillName, status, req, have, roleTitle, weekNo) {
  const s = normalizeSkillName(skillName) || "this skill";
  const preset = presetForSkill(s);

  const genericLearn = [
    `Review core concepts and common pitfalls for ${s}`,
    `Write a 1-page cheat sheet for ${s} (definitions + examples)`,
    `Watch one focused tutorial and take notes for ${s}`,
  ];

  const genericBuild = [
    `Implement a small feature using ${s} in your app (real route, real UI, real DB if relevant)`,
    `Build a mini demo project for ${s} (small but complete)`,
    `Refactor an existing part of your codebase to use ${s} properly`,
  ];

  const genericQuality = [
    `Add 2 tests covering ${s} (happy path + failure)`,
    `Document ${s} usage in README with examples`,
    `Add input validation and error handling relevant to ${s}`,
  ];

  const learnPool = preset?.learn?.length ? preset.learn : genericLearn;
  const buildPool = preset?.build?.length ? preset.build : genericBuild;
  const qualityPool = preset?.quality?.length ? preset.quality : genericQuality;

  const seedBase = `${roleTitle || ""}|${s}|${status}|w${weekNo}`;

  if (status === "missing") {
    const learn = pickMany(learnPool, 1, seedBase + "|learn")[0];
    const build = pickMany(buildPool, 1, seedBase + "|build")[0];
    const quality = pickMany(qualityPool, 1, seedBase + "|quality")[0];
    return [
      learn,
      build,
      quality,
      `Target: reach level ${req} for ${s} by end of week ${weekNo}`,
    ];
  }

  const improve = pickMany(
    [
      `Improve ${s} from level ${have} to ${req} with focused practice`,
      `Close the gap on ${s}: aim for level ${req} using a real feature`,
      `Strengthen ${s} by implementing the missing pieces you avoid`,
    ],
    1,
    seedBase + "|improve"
  )[0];

  const build = pickMany(buildPool, 1, seedBase + "|build")[0];
  const quality = pickMany(qualityPool, 1, seedBase + "|quality")[0];
  return [improve, build, quality];
}

function evidenceSuggestion(skillName, roleTitle, weekNo) {
  const s = normalizeSkillName(skillName) || "this skill";
  const preset = presetForSkill(s);

  const genericEvidence = [
    `Commit link + short README note explaining how you used ${s}`,
    `Screenshot or short demo video showing ${s} working`,
    `Before/after refactor screenshot showing improvement in ${s}`,
    `Test output screenshot proving ${s} is covered`,
  ];

  const pool = preset?.evidence?.length ? preset.evidence : genericEvidence;
  const picks = pickMany(pool, 2, `${roleTitle || ""}|${s}|w${weekNo}|evidence`);
  return `Evidence: ${picks.join(" + ")}`;
}

/**
 * Computes a sort priority for a skill gap item to determine its position in
 * the weekly plan.
 *
 * Missing skills receive a flat boost of 100 and partial skills receive 50,
 * ensuring all gaps appear before fully matched skills regardless of importance.
 * Within each status group, importance weight and required level break ties so
 * that high-stakes, high-difficulty skills are scheduled in earlier weeks.
 *
 * @param {object} r - Gap item with status, importance, and required_level fields.
 * @returns {number} Priority score (higher value = scheduled earlier in the plan).
 */
function priorityScore(r) {
  const weight = safeNum(r.importance, 1);
  const req = safeNum(r.required_level, 1);
  const missingBoost = r.status === "missing" ? 100 : 0;
  const partialBoost = r.status === "partial" ? 50 : 0;
  return missingBoost + partialBoost + weight * 10 + req;
}

function buildPlan(gapItems, weeks, roleTitle) {
  const w = clamp(safeNum(weeks, 4), 1, 24);

  const focus = (gapItems || [])
    .filter((r) => r.status === "missing" || r.status === "partial")
    .sort((a, b) => priorityScore(b) - priorityScore(a));

  const buckets = Array.from({ length: w }, () => []);
  // Distribute skills across weeks round-robin so each week has a balanced workload.
  focus.forEach((it, idx) => buckets[idx % w].push(it));

  const weeks_data = buckets.map((arr, i) => {
    const weekNo = i + 1;
    return {
      week_no: weekNo,
      title: `Week ${weekNo}`,
      items: arr.map((r) => ({
        skill_id: r.skill_id,
        name: r.name,
        category: r.category,
        status: r.status,
        required_level: r.required_level,
        user_level: r.user_level,
        importance: r.importance,
        // Missing skills (starting from zero) are estimated at 3 hours; partial skills at 2.
        estimated_hours: r.status === "missing" ? 3 : 2,
        suggested_tasks: tasksFor(
          r.name,
          r.status,
          r.required_level,
          r.user_level,
          roleTitle,
          weekNo
        ),
        suggested_evidence: evidenceSuggestion(r.name, roleTitle, weekNo),
      })),
    };
  });

  return { weeks: w, weeks_data };
}

module.exports = {
  safeNum,
  clamp,
  statusOrder,
  hashString,
  pickMany,
  normalizeSkillName,
  presetForSkill,
  tasksFor,
  evidenceSuggestion,
  priorityScore,
  buildPlan,
};