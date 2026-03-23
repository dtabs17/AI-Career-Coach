/**
 * Read-only role catalogue used by recommendations, planning, and interviews.
 */
const router = require("express").Router();
const { pool } = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, entry_level
       FROM career_roles
       ORDER BY entry_level DESC, title ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
