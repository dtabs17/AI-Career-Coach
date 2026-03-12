const router = require("express").Router();
const { pool } = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, category
       FROM skills
       ORDER BY category NULLS LAST, name ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/roles", async (req, res, next) => {
  try {
    const skillId = Number(req.params.id);
    if (!skillId || isNaN(skillId)) return res.status(400).json({ error: "Invalid skill id" });
    const { rows } = await pool.query(
      `SELECT cr.id, cr.title, cr.entry_level
       FROM role_skills rs
       JOIN career_roles cr ON cr.id = rs.role_id
       WHERE rs.skill_id = $1
       ORDER BY cr.title ASC`,
      [skillId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
