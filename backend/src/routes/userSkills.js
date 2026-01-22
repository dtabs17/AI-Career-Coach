const router = require("express").Router();
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT us.skill_id, s.name, s.category, us.proficiency_level, us.evidence, us.updated_at
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = $1
       ORDER BY s.category NULLS LAST, s.name ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { skill_id, proficiency_level, evidence } = req.body || {};
    if (!skill_id || !proficiency_level) {
      return res.status(400).json({ error: "skill_id and proficiency_level required" });
    }

    const { rows } = await pool.query(
      `INSERT INTO user_skills (user_id, skill_id, proficiency_level, evidence)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, skill_id)
       DO UPDATE SET
         proficiency_level = EXCLUDED.proficiency_level,
         evidence = EXCLUDED.evidence,
         updated_at = now()
       RETURNING user_id, skill_id, proficiency_level, evidence, updated_at`,
      [req.user.id, skill_id, proficiency_level, evidence || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:skillId", requireAuth, async (req, res, next) => {
  try {
    const skillId = Number(req.params.skillId);
    const result = await pool.query(
      `DELETE FROM user_skills WHERE user_id = $1 AND skill_id = $2`,
      [req.user.id, skillId]
    );
    res.json({ deleted: result.rowCount });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
