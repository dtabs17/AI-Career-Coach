const router = require("express").Router();
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth");

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

        const { rows } = await pool.query(
            `INSERT INTO profiles (
         user_id, full_name, year_of_study, course, interests,
         academic_focus, preferred_technologies, preferred_roles
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
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
                preferred_technologies || null,
                preferred_roles || null,
            ]
        );

        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
