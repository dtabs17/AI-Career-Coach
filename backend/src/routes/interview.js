/**
 * Interview session routes for creating mock interviews, submitting answers,
 * and reviewing completed sessions.
 */
const router = require("express").Router();
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth_middleware");
const { generateInterviewQuestion, evaluateAnswer } = require("../utils/openai");

/**
 * Ensures the requested interview session belongs to the authenticated user
 * before any turn data is read or mutated.
 */
async function assertSessionOwner(client, sessionId, userId) {
  const { rows } = await client.query(
    `SELECT * FROM interview_sessions WHERE id = $1`,
    [sessionId]
  );
  const session = rows[0];
  if (!session) return { ok: false, status: 404, error: "Session not found" };
  if (Number(session.user_id) !== Number(userId))
    return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, session };
}

router.get("/sessions", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `SELECT 
        s.id, 
        s.role_id, 
        s.mode, 
        s.total_questions, 
        s.current_question_number,
        s.status, 
        s.average_score, 
        s.created_at, 
        s.completed_at,
        r.title as role_title
       FROM interview_sessions s
       LEFT JOIN career_roles r ON r.id = s.role_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
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
    const { role_id, mode, total_questions = 5 } = req.body || {};

    if (!role_id) {
      return res.status(400).json({ error: "role_id required" });
    }

    const validModes = ["technical", "behavioral", "mixed"];
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        error: `mode must be one of: ${validModes.join(", ")}`
      });
    }

    const numQuestions = Number(total_questions);
    if (!Number.isInteger(numQuestions) || numQuestions < 3 || numQuestions > 10) {
      return res.status(400).json({ error: "total_questions must be between 3 and 10" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: sessionRows } = await client.query(
        `INSERT INTO interview_sessions 
         (user_id, role_id, mode, total_questions, current_question_number, status)
         VALUES ($1, $2, $3, $4, 0, 'in_progress')
         RETURNING *`,
        [userId, role_id, mode, numQuestions]
      );

      const session = sessionRows[0];
      const { rows: roleRows } = await client.query(
        `SELECT title, description FROM career_roles WHERE id = $1`,
        [role_id]
      );
      const role = roleRows[0];

      // The first question is generated and persisted inside the same transaction
      // so the session is never left in a state where it has no turn to display.
      const firstQuestion = await generateInterviewQuestion({
        roleTitle: role?.title || "Unknown Role",
        mode,
        turnNumber: 1,
        totalQuestions: numQuestions,
        previousTurns: [],
      });

      const { rows: turnRows } = await client.query(
        `INSERT INTO interview_turns 
         (session_id, turn_number, question)
         VALUES ($1, 1, $2)
         RETURNING *`,
        [session.id, firstQuestion]
      );

      await client.query(
        `UPDATE interview_sessions SET current_question_number = 1 WHERE id = $1`,
        [session.id]
      );

      await client.query("COMMIT");

      res.status(201).json({
        session: { ...session, current_question_number: 1, role_title: role?.title },
        first_turn: turnRows[0],
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

router.get("/sessions/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessionId = Number(req.params.id);

    if (!Number.isFinite(sessionId)) {
      return res.status(400).json({ error: "Invalid session id" });
    }

    const client = await pool.connect();
    try {
      const check = await assertSessionOwner(client, sessionId, userId);
      if (!check.ok) {
        return res.status(check.status).json({ error: check.error });
      }

      const { rows: sessionRows } = await client.query(
        `SELECT 
          s.*, 
          r.title as role_title,
          r.description as role_description
         FROM interview_sessions s
         LEFT JOIN career_roles r ON r.id = s.role_id
         WHERE s.id = $1`,
        [sessionId]
      );

      const { rows: turns } = await client.query(
        `SELECT * FROM interview_turns 
         WHERE session_id = $1 
         ORDER BY turn_number ASC`,
        [sessionId]
      );

      res.json({
        session: sessionRows[0],
        turns,
      });
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

router.post("/sessions/:id/answer", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessionId = Number(req.params.id);
    const { answer } = req.body || {};

    if (!Number.isFinite(sessionId)) {
      return res.status(400).json({ error: "Invalid session id" });
    }

    if (!answer || typeof answer !== "string") {
      return res.status(400).json({ error: "answer required" });
    }

    if (answer.length > 5000) {
      return res.status(400).json({ error: "Answer too long (max 5000 chars)" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const check = await assertSessionOwner(client, sessionId, userId);
      if (!check.ok) {
        await client.query("ROLLBACK");
        return res.status(check.status).json({ error: check.error });
      }

      const session = check.session;

      if (session.status !== "in_progress") {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Interview already completed" });
      }

      const currentTurnNumber = session.current_question_number;
      const { rows: currentTurnRows } = await client.query(
        `SELECT * FROM interview_turns 
         WHERE session_id = $1 AND turn_number = $2`,
        [sessionId, currentTurnNumber]
      );

      const currentTurn = currentTurnRows[0];
      if (!currentTurn) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Current question not found" });
      }

      if (currentTurn.user_answer) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Question already answered" });
      }

      const { rows: roleRows } = await client.query(
        `SELECT title FROM career_roles WHERE id = $1`,
        [session.role_id]
      );
      const roleTitle = roleRows[0]?.title || "Unknown Role";

      const evaluation = await evaluateAnswer({
        question: currentTurn.question,
        answer,
        roleTitle,
        mode: session.mode,
      });

      await client.query(
        `UPDATE interview_turns 
         SET user_answer = $1, ai_rating = $2, ai_feedback = $3, answered_at = NOW()
         WHERE id = $4`,
        [answer, evaluation.rating, evaluation.feedback, currentTurn.id]
      );

      const isLastQuestion = currentTurnNumber >= session.total_questions;

      let nextTurn = null;

      if (!isLastQuestion) {
        // Pass all answered turns so far so the model can avoid repeating topics.
        const { rows: previousTurnsRows } = await client.query(
          `SELECT turn_number, question, user_answer, ai_rating 
           FROM interview_turns 
           WHERE session_id = $1 AND turn_number <= $2
           ORDER BY turn_number ASC`,
          [sessionId, currentTurnNumber]
        );

        const nextQuestion = await generateInterviewQuestion({
          roleTitle,
          mode: session.mode,
          turnNumber: currentTurnNumber + 1,
          totalQuestions: session.total_questions,
          previousTurns: previousTurnsRows,
        });

        const { rows: nextTurnRows } = await client.query(
          `INSERT INTO interview_turns 
           (session_id, turn_number, question)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [sessionId, currentTurnNumber + 1, nextQuestion]
        );

        nextTurn = nextTurnRows[0];

        await client.query(
          `UPDATE interview_sessions 
           SET current_question_number = $1 
           WHERE id = $2`,
          [currentTurnNumber + 1, sessionId]
        );
      } else {
        // Last question answered: calculate the average score across all turns
        // and mark the session as completed.
        const { rows: avgRows } = await client.query(
          `SELECT AVG(ai_rating) as avg_score 
           FROM interview_turns 
           WHERE session_id = $1 AND ai_rating IS NOT NULL`,
          [sessionId]
        );

        const avgScore = Number(avgRows[0]?.avg_score) || 0;

        await client.query(
          `UPDATE interview_sessions 
           SET status = 'completed', average_score = $1, completed_at = NOW()
           WHERE id = $2`,
          [avgScore, sessionId]
        );
      }

      await client.query("COMMIT");

      res.json({
        evaluation: {
          rating: evaluation.rating,
          feedback: evaluation.feedback,
        },
        next_turn: nextTurn,
        is_complete: isLastQuestion,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

router.delete("/sessions/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessionId = Number(req.params.id);

    if (!Number.isFinite(sessionId)) {
      return res.status(400).json({ error: "Invalid session id" });
    }

    const client = await pool.connect();
    try {
      const check = await assertSessionOwner(client, sessionId, userId);
      if (!check.ok) {
        return res.status(check.status).json({ error: check.error });
      }

      await client.query(
        `DELETE FROM interview_sessions WHERE id = $1`,
        [sessionId]
      );

      res.json({ success: true });
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

router.get("/voices", requireAuth, async (req, res, next) => {
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
    });
    const data = await response.json();
    if (!data.voices) {
      console.log("ElevenLabs voices error:", data);
      return res.status(502).json({ error: "Failed to fetch voices from ElevenLabs" });
    }
    const voices = data.voices.map((v) => ({ voice_id: v.voice_id, name: v.name }));
    res.json(voices);
  } catch (err) { next(err); }
});

// ElevenLabs voice ID for "Eric", used for all interview question narration.
// Hardcoded to ensure a consistent listening experience across all sessions.
// The eleven_turbo_v2_5 model is used for low-latency streaming on the TTS endpoint.
const INTERVIEW_VOICE_ID = "cjVigY5qzO86Huf0OWal";

router.post("/tts", requireAuth, async (req, res, next) => {
  try {
    const { text } = req.body;
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${INTERVIEW_VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);
  } catch (err) { next(err); }
});

module.exports = router;