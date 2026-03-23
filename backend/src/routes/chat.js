const router = require("express").Router();
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth_middleware");
const { generateCoachReply } = require("../utils/openai");
const { buildFallbackReply } = require("../utils/openai_utils");
const DEFAULT_TITLE = "New Chat";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

async function assertSessionOwner(client, sessionId, userId) {
  const { rows } = await client.query(
    `SELECT id, user_id, title, created_at
     FROM chat_sessions
     WHERE id = $1`,
    [sessionId]
  );
  const s = rows[0];
  if (!s) return { ok: false, status: 404, error: "Session not found" };
  if (Number(s.user_id) !== Number(userId)) return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, session: s };
}

/**
 * Derives a short, readable title from the first message in a chat session.
 *
 * Markdown syntax (code blocks, inline code, headings, emphasis) is stripped
 * first so the title does not contain raw formatting characters. The text is
 * then cut at the first sentence boundary and capped at 60 characters.
 *
 * @param {string} text - The raw message content to derive a title from.
 * @returns {string} A trimmed title string, or DEFAULT_TITLE if nothing usable remains.
 */
function makeChatTitle(text) {
  let s = String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[#>*_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!s)
    return DEFAULT_TITLE;

  const cut = s.split(/[.?!]\s/)[0]?.trim() || s;

  let title = cut.length > 60 ? cut.slice(0, 57).trim() + "..." : cut;

  title = title.replace(/[.?!,:;]+$/, "").trim();

  return title || DEFAULT_TITLE;
}

router.get("/sessions", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `SELECT
         s.id,
         s.title,
         s.created_at,
         m.created_at AS last_message_at,
         m.content AS last_message_preview
       FROM chat_sessions s
       LEFT JOIN LATERAL (
         SELECT created_at, content
         FROM chat_messages
         WHERE session_id = s.id
         ORDER BY created_at DESC
         LIMIT 1
       ) m ON true
       WHERE s.user_id = $1
       ORDER BY COALESCE(m.created_at, s.created_at) DESC
       LIMIT 50`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/sessions", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const title = String(req.body?.title || "").trim() || DEFAULT_TITLE;

    const { rows } = await pool.query(
      `INSERT INTO chat_sessions (user_id, title)
       VALUES ($1, $2)
       RETURNING id, user_id, title, created_at`,
      [userId, title]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch("/sessions/:sessionId", requireAuth, async (req, res, next) => {
  const userId = req.user.id;
  const sessionId = Number(req.params.sessionId);
  const title = String(req.body?.title || "").trim();

  if (!Number.isFinite(sessionId)) return res.status(400).json({ error: "Invalid session id" });
  if (!title) return res.status(400).json({ error: "Title is required" });
  if (title.length > 80) return res.status(400).json({ error: "Title too long (max 80 chars)" });

  const client = await pool.connect();
  try {
    const owner = await assertSessionOwner(client, sessionId, userId);
    if (!owner.ok) return res.status(owner.status).json({ error: owner.error });

    const { rows } = await client.query(
      `UPDATE chat_sessions
       SET title = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, title`,
      [title, sessionId, userId]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
});

router.delete("/sessions/:sessionId", requireAuth, async (req, res, next) => {
  const userId = req.user.id;
  const sessionId = Number(req.params.sessionId);

  if (!Number.isFinite(sessionId)) return res.status(400).json({ error: "Invalid session id" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const owner = await assertSessionOwner(client, sessionId, userId);
    if (!owner.ok) {
      await client.query("ROLLBACK");
      return res.status(owner.status).json({ error: owner.error });
    }
    await client.query(`DELETE FROM chat_messages WHERE session_id = $1`, [sessionId]);

    const del = await client.query(
      `DELETE FROM chat_sessions
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [sessionId, userId]
    );

    await client.query("COMMIT");

    if (!del.rowCount) return res.status(404).json({ error: "Session not found" });
    return res.json({ ok: true, deleted_id: del.rows[0].id });
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch { }
    next(err);
  } finally {
    client.release();
  }
});

router.get("/sessions/:sessionId/messages", requireAuth, async (req, res, next) => {
  const userId = req.user.id;
  const sessionId = Number(req.params.sessionId);
  const limit = clamp(Number(req.query.limit || 200), 1, 500);

  if (!Number.isFinite(sessionId)) return res.status(400).json({ error: "Invalid session id" });

  const client = await pool.connect();
  try {
    const owner = await assertSessionOwner(client, sessionId, userId);
    if (!owner.ok) return res.status(owner.status).json({ error: owner.error });

    const { rows } = await client.query(
      `SELECT id, session_id, role, content, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [sessionId, limit]
    );

    res.json({ session: owner.session, messages: rows });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
});

router.post("/sessions/:sessionId/messages", requireAuth, async (req, res, next) => {
  const userId = req.user.id;
  const sessionId = Number(req.params.sessionId);

  const content = String(req.body?.content || "").trim();

  if (!Number.isFinite(sessionId))
    return res.status(400).json({ error: "Invalid session id" });
  if (!content)
    return res.status(400).json({ error: "Message content required" });
  if (content.length > 4000)
    return res.status(400).json({ error: "Message too long" });

  // A PostgreSQL advisory lock is used here to prevent a race condition where
  // two requests on the same session arrive simultaneously and both call the
  // OpenAI API, resulting in two assistant messages being inserted for a single
  // user message. The lock is scoped to (LOCK_NS, sessionId) so sessions do not
  // block each other. LOCK_NS is an arbitrary application namespace constant
  // chosen to avoid colliding with advisory locks from other parts of the app.
  const LOCK_NS = 7711;
  const lockKey1 = LOCK_NS;
  const lockKey2 = sessionId;

  const client = await pool.connect();

  try {
    const owner = await assertSessionOwner(client, sessionId, userId);
    if (!owner.ok) return res.status(owner.status).json({ error: owner.error });
    await client.query("SELECT pg_advisory_lock($1::int, $2::int)", [lockKey1, lockKey2]);

    await client.query("BEGIN");

    const userMsgRes = await client.query(
      `INSERT INTO chat_messages (session_id, role, content)
       VALUES ($1, 'user', $2)
       RETURNING id, session_id, role, content, created_at`,
      [sessionId, content]
    );
    const userMsg = userMsgRes.rows[0];

    const countRes = await client.query(
      `SELECT COUNT(*)::int AS cnt
       FROM chat_messages
       WHERE session_id = $1 AND role = 'user'`,
      [sessionId]
    );
    const userMsgCount = countRes.rows[0]?.cnt ?? 0;

    // Auto-title only fires on the first user message. The WHERE clause guards
    // against overwriting a title the user has already set manually.
    if (userMsgCount === 1) {
      const title = makeChatTitle(content);
      await client.query(
        `UPDATE chat_sessions
         SET title = $1
         WHERE id = $2 AND user_id = $3 AND (title IS NULL OR title = $4)`,
        [title, sessionId, userId, DEFAULT_TITLE]
      );
    }

    await client.query("COMMIT");

    const profileRes = await client.query(
      `SELECT
         full_name,
         year_of_study,
         course,
         interests,
         academic_focus,
         preferred_technologies,
         preferred_roles
       FROM profiles
       WHERE user_id = $1`,
      [userId]
    );
    const profile = profileRes.rows[0] || null;

    const skillsRes = await client.query(
      `SELECT s.name, us.proficiency_level
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = $1
       ORDER BY us.proficiency_level DESC, s.name ASC`,
      [userId]
    );
    const skills = skillsRes.rows || [];

    // The last 12 messages are passed as context. This keeps the prompt within
    // a reasonable token budget while still giving the model enough history to
    // follow the conversation.
    const contextRes = await client.query(
      `SELECT role, content
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at DESC
       LIMIT 12`,
      [sessionId]
    );

    const context = contextRes.rows.reverse().map((m) => ({ role: m.role, content: m.content }));

    let assistantText = "";
    try {
      assistantText = await generateCoachReply({ messages: context, profile, skills });
    } catch {
      assistantText = "";
    }

    const finalAssistantText = buildFallbackReply(assistantText);
    await client.query("BEGIN");

    const assistantMsgRes = await client.query(
      `INSERT INTO chat_messages (session_id, role, content)
       VALUES ($1, 'assistant', $2)
       RETURNING id, session_id, role, content, created_at`,
      [sessionId, finalAssistantText]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      user: userMsg,
      assistant: assistantMsgRes.rows[0],
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch { }
    next(err);
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1::int, $2::int)", [lockKey1, lockKey2]);
    } catch { }
    client.release();
  }
});


module.exports = router;