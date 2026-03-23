const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth_middleware");

/**
 * Converts a JWT expiry string (e.g. "7d", "2h", "30m") into milliseconds.
 * Used to keep the cookie maxAge in sync with the token expiry so both expire
 * at the same time.
 *
 * Falls back to 7 days if the string is missing or does not match the expected
 * format. Supported units: ms, s, m, h, d, w.
 *
 * @param {string} s - Expiry string, e.g. "7d" or "3600s".
 * @returns {number} Duration in milliseconds.
 */
function parseExpiryMs(s) {
  if (!s) return 7 * 24 * 60 * 60 * 1000;
  const match = String(s).match(/^(\d+)(ms|s|m|h|d|w)?$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(match[1]);
  const unit = match[2] || "s";
  const mul = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
  return n * (mul[unit] || 1000);
}

/**
 * Signs a JWT for the given user and sets it as an HttpOnly cookie on the response.
 *
 * Cookie flags:
 *   httpOnly  - prevents client-side JavaScript from reading the token.
 *   sameSite  - set to "lax" to allow the cookie on top-level navigations while
 *               blocking it on cross-site requests, which mitigates CSRF without
 *               requiring an explicit CSRF token.
 *   secure    - only sent over HTTPS in production; left off in development so
 *               the app works over plain HTTP locally.
 *
 * The userId is cast to a string because the JWT sub claim must be a string
 * per the JWT specification (RFC 7519).
 *
 * @param {import("express").Response} res
 * @param {number|string} userId - The authenticated user's database ID.
 */
function setAuthCookie(res, userId) {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  const token = jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(userId),
    expiresIn,
  });

  res.cookie(process.env.COOKIE_NAME || "access_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: parseExpiryMs(expiresIn),
  });
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rowCount) return res.status(409).json({ error: "Email already in use" });

    // Salt rounds of 12 gives a good balance between hashing time and security.
    // Values below 10 are considered too weak; values above 14 add noticeable latency.
    const passwordHash = await bcrypt.hash(password, 12);

    const created = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email`,
      [email, passwordHash]
    );

    setAuthCookie(res, created.rows[0].id);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const result = await pool.query(
      `SELECT id, email, password_hash FROM users WHERE email = $1`,
      [email]
    );
    if (!result.rowCount) return res.status(401).json({ error: "Invalid credentials" });

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    setAuthCookie(res, user.id);
    res.json({ id: user.id, email: user.email });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(process.env.COOKIE_NAME || "access_token");
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userRes = await pool.query(
      `SELECT id, email FROM users WHERE id = $1`,
      [userId]
    );

    const profileRes = await pool.query(
      `SELECT full_name FROM profiles WHERE user_id = $1`,
      [userId]
    );

    const user = userRes.rows[0];
    const fullName = profileRes.rows[0]?.full_name || null;

    let firstName = null;
    if (fullName && typeof fullName === "string") {
      firstName = fullName.trim().split(/\s+/)[0] || null;
    }

    // If no full name is saved yet, derive a display name from the email local part
    // so the UI always has something to show rather than falling back to "Unknown".
    if (!firstName && user?.email) {
      const raw = user.email.split("@")[0];
      firstName = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : null;
    }

    res.json({
      id: user.id,
      email: user.email,
      full_name: fullName,
      first_name: firstName,
    });
  } catch (err) {
    next(err);
  }
});


module.exports = router;