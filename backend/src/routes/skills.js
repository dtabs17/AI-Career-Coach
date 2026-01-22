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

module.exports = router;
