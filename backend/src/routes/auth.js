const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth_middleware");

function setAuthCookie(res, userId) {
  const token = jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  res.cookie(process.env.COOKIE_NAME || "access_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rowCount) return res.status(409).json({ error: "Email already in use" });

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
