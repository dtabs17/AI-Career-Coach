/**
 * Profile routes for the user-specific metadata that feeds recommendations,
 * planner generation, and chat context.
 */
const router = require("express").Router();
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth_middleware");

router.get("/", requireAuth, async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT *
       FROM profiles
       WHERE user_id = $1`,
            [req.user.id]
        );
        res.json(rows[0] || null);
    } catch (err) {
        next(err);
    }
});

router.put("/", requireAuth, async (req, res, next) => {
  try {
    const {
      full_name,
      year_of_study,
      course,
      interests,
      academic_focus,
      preferred_technologies,
      preferred_roles,
    } = req.body || {};

    const prefTech = Array.isArray(preferred_technologies) ? preferred_technologies : null;
    const prefRoles = Array.isArray(preferred_roles) ? preferred_roles : null;

    // Profiles are keyed by user_id, so updates use an UPSERT instead of a
    // separate existence check and update round-trip.
    const { rows } = await pool.query(
      `INSERT INTO profiles (
         user_id, full_name, year_of_study, course, interests,
         academic_focus, preferred_technologies, preferred_roles
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7::json,$8::json)
       ON CONFLICT (user_id)
       DO UPDATE SET
         full_name = EXCLUDED.full_name,
         year_of_study = EXCLUDED.year_of_study,
         course = EXCLUDED.course,
         interests = EXCLUDED.interests,
         academic_focus = EXCLUDED.academic_focus,
         preferred_technologies = EXCLUDED.preferred_technologies,
         preferred_roles = EXCLUDED.preferred_roles,
         updated_at = now()
       RETURNING *`,
      [
        req.user.id,
        full_name || null,
        year_of_study || null,
        course || null,
        interests || null,
        academic_focus || null,
        prefTech ? JSON.stringify(prefTech) : null,
        prefRoles ? JSON.stringify(prefRoles) : null,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
