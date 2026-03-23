const router = require("express").Router();
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth_middleware");
const { hashSnapshot } = require("../utils/hash");
const {
  clamp,
  round1,
  normalizeStringArray,
  toLowerSet,
  scoreRole,
  sortBestFit,
  sortBestFitPlus,
  PREFERRED_ROLE_BONUS,
  MAX_TECH_BONUS,
  MAX_TOTAL_BONUS,
} = require("../utils/scoring");

/**
 * Safely parses a value that may already be a parsed object or a JSON string.
 *
 * The explanation column in recommendation_items is stored as JSONB but the pg
 * driver can return it as either a plain object or a JSON-encoded string depending
 * on how the query casts it. This function handles both cases without throwing.
 *
 * @param {string|object|null} v - Value to parse.
 * @returns {object|null} Parsed object, or null if the input is empty or invalid.
 */
function parseJsonMaybe(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
  return null;
}

router.post("/run", requireAuth, async (req, res, next) => {
  const userId = req.user.id;
  const topN = clamp(Number(req.body?.top_n ?? 10), 1, 25);

  const algoVersion = "v2-preferences";

  const executedAt = new Date().toISOString();

  const client = await pool.connect();
  try {
    const userSkillsRes = await client.query(
      `SELECT skill_id, proficiency_level
       FROM user_skills
       WHERE user_id = $1`,
      [userId]
    );

    if (!userSkillsRes.rowCount) {
      return res.status(400).json({ error: "Add some skills before running recommendations." });
    }

    const profileRes = await client.query(
      `SELECT academic_focus, preferred_technologies, preferred_roles
       FROM profiles
       WHERE user_id = $1`,
      [userId]
    );

    const profile = profileRes.rows[0] || null;

    const preferredRoles = normalizeStringArray(profile?.preferred_roles);
    const preferredTech = normalizeStringArray(profile?.preferred_technologies);

    const preferredRolesSet = toLowerSet(preferredRoles);
    const preferredTechSet = toLowerSet(preferredTech);

    const inputSnapshot = {
      top_n: topN,
      skills: userSkillsRes.rows
        .map((s) => ({
          skill_id: Number(s.skill_id),
          proficiency_level: Number(s.proficiency_level || 0),
        }))
        .sort((a, b) => a.skill_id - b.skill_id),
      profile: profile
        ? {
          academic_focus: profile.academic_focus || null,
          preferred_technologies: preferredTech.length ? preferredTech : null,
          preferred_roles: preferredRoles.length ? preferredRoles : null,
        }
        : null,
      algo: {
        version: algoVersion,
        preferred_role_bonus: PREFERRED_ROLE_BONUS,
        max_tech_bonus: MAX_TECH_BONUS,
        max_total_bonus: MAX_TOTAL_BONUS,
      },
    };

    const inputHash = hashSnapshot(inputSnapshot);

    // ON CONFLICT does a no-op update (sets created_at to its own value) solely
    // to trigger the RETURNING clause. xmax = 0 is a PostgreSQL internal that is
    // true only on a freshly inserted row, so it reliably distinguishes an insert
    // from an update caused by a conflict. This lets us detect cache hits without
    // a separate SELECT query.
    const runRes = await client.query(
      `INSERT INTO recommendation_runs (user_id, input_snapshot, input_hash, algo_version)
       VALUES ($1, $2::json, $3, $4)
       ON CONFLICT (user_id, input_hash, algo_version)
       DO UPDATE SET created_at = recommendation_runs.created_at
       RETURNING id, user_id, created_at, input_snapshot, input_hash, algo_version, (xmax = 0) AS inserted`,
      [userId, JSON.stringify(inputSnapshot), inputHash, algoVersion]
    );

    const run = runRes.rows[0];
    // The pg driver can return the boolean as true, "t", or 1 depending on the
    // PostgreSQL version and driver configuration, so all three are checked.
    const inserted =
      run.inserted === true || run.inserted === "t" || run.inserted === 1;

    if (!inserted) {
      const itemsRes = await client.query(
        `SELECT
           ri.role_id,
           cr.title,
           cr.description,
           ri.competency_score,
           ri.preference_bonus,
           ri.final_score,
           ri.explanation
         FROM recommendation_items ri
         JOIN career_roles cr ON cr.id = ri.role_id
         WHERE ri.run_id = $1`,
        [run.id]
      );

      if (itemsRes.rowCount) {
        const all = itemsRes.rows.map((r) => {
          const explanation = parseJsonMaybe(r.explanation);
          const pref = explanation?.preference || null;

          return {
            role_id: Number(r.role_id),
            title: r.title,
            description: r.description,
            competency_score: Number(r.competency_score || 0),
            preference_bonus: Number(r.preference_bonus || 0),
            final_score: Number(r.final_score || 0),
            explanation,
            preference: pref,
          };
        });

        const bestFit = sortBestFit(all).slice(0, topN);
        const bestFitPlus = sortBestFitPlus(all).slice(0, topN);

        const preferredAlignment = preferredRoles.length
          ? all
            .filter((x) => x.preference?.is_preferred_role)
            .sort((a, b) => {
              if (b.final_score !== a.final_score) return b.final_score - a.final_score;
              return b.competency_score - a.competency_score;
            })
            .slice(0, topN)
          : [];

        return res.json({
          run,
          cached: true,
          executed_at: executedAt,
          views: {
            best_fit: bestFit,
            best_fit_plus_preferences: bestFitPlus,
            preferred_roles_alignment: preferredAlignment,
          },
        });
      }
    }

    const userSkillMap = new Map();
    for (const r of userSkillsRes.rows) {
      userSkillMap.set(Number(r.skill_id), Number(r.proficiency_level || 0));
    }

    const roleSkillsRes = await client.query(
      `SELECT
         cr.id AS role_id,
         cr.title AS role_title,
         cr.description AS role_description,
         cr.entry_level AS entry_level,
         rs.skill_id,
         rs.required_level,
         rs.importance,
         s.name AS skill_name,
         s.category AS skill_category
       FROM career_roles cr
       JOIN role_skills rs ON rs.role_id = cr.id
       JOIN skills s ON s.id = rs.skill_id
       ORDER BY cr.id ASC, s.category NULLS LAST, s.name ASC`
    );

    if (!roleSkillsRes.rowCount) {
      return res.status(400).json({ error: "No role requirements found. Seed career_roles and role_skills first." });
    }

    const byRole = new Map();
    for (const row of roleSkillsRes.rows) {
      const roleId = Number(row.role_id);
      if (!byRole.has(roleId)) {
        byRole.set(roleId, {
          role_id: roleId,
          title: row.role_title,
          description: row.role_description,
          entry_level: row.entry_level,
          reqs: [],
        });
      }
      byRole.get(roleId).reqs.push({
        skill_id: Number(row.skill_id),
        skill_name: row.skill_name,
        skill_name_lc: String(row.skill_name || "").toLowerCase(),
        category: row.skill_category,
        required_level: Number(row.required_level || 1),
        importance: Number(row.importance || 1),
      });
    }

    const scoredAll = [];
    for (const role of byRole.values()) {
      const scored = scoreRole({ role, userSkillMap, preferredRolesSet, preferredTechSet });

      scoredAll.push({
        ...scored,
        description: role.description,
        entry_level: role.entry_level,
      });
    }

    const bestFit = sortBestFit(scoredAll).slice(0, topN);
    const bestFitPlus = sortBestFitPlus(scoredAll).slice(0, topN);

    const preferredAlignment = preferredRoles.length
      ? scoredAll
        .filter((r) => r.preference?.is_preferred_role)
        .sort((a, b) => {
          if (b.final_score !== a.final_score) return b.final_score - a.final_score;
          return b.competency_score - a.competency_score;
        })
        .slice(0, topN)
      : [];

    await client.query("BEGIN");

    await client.query(`DELETE FROM recommendation_items WHERE run_id = $1`, [run.id]);

    const rowsToStore = scoredAll;

    // Build a single parameterised bulk INSERT rather than inserting rows one at
    // a time. This reduces round trips to the database when there are many roles.
    const params = [];
    const valuesSql = [];
    let p = 1;

    for (const item of rowsToStore) {
      valuesSql.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
      params.push(
        run.id,
        item.role_id,
        item.final_score,
        item.competency_score,
        item.preference_bonus,
        item.final_score,
        JSON.stringify({ ...item.explanation, preference: item.preference })
      );
    }

    if (valuesSql.length) {
      await client.query(
        `INSERT INTO recommendation_items
           (run_id, role_id, score, competency_score, preference_bonus, final_score, explanation)
         VALUES ${valuesSql.join(", ")}`,
        params
      );
    }

    await client.query("COMMIT");

    res.json({
      run,
      cached: false,
      executed_at: executedAt,
      views: {
        best_fit: bestFit,
        best_fit_plus_preferences: bestFitPlus,
        preferred_roles_alignment: preferredAlignment,
      },
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch { }
    next(err);
  } finally {
    client.release();
  }
});

router.get("/runs", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      `SELECT 
         rr.id,
         rr.user_id,
         rr.created_at,
         rr.algo_version,
         rr.input_hash,
         (
           SELECT cr.title
           FROM recommendation_items ri
           JOIN career_roles cr ON cr.id = ri.role_id
           WHERE ri.run_id = rr.id
           ORDER BY ri.final_score DESC, ri.competency_score DESC
           LIMIT 1
         ) AS top_role_title
       FROM recommendation_runs rr
       WHERE rr.user_id = $1
       ORDER BY rr.created_at DESC
       LIMIT 25`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/runs/:runId", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const runId = Number(req.params.runId);
    if (!Number.isFinite(runId)) return res.status(400).json({ error: "Invalid run id" });

    const runRes = await pool.query(
      `SELECT id, user_id, created_at, input_snapshot, algo_version, input_hash
       FROM recommendation_runs
       WHERE id = $1 AND user_id = $2`,
      [runId, userId]
    );

    if (!runRes.rowCount) return res.status(404).json({ error: "Run not found" });

    const itemsRes = await pool.query(
      `SELECT
         ri.role_id,
         cr.title,
         cr.description,
         ri.competency_score,
         ri.preference_bonus,
         ri.final_score,
         ri.explanation
       FROM recommendation_items ri
       JOIN career_roles cr ON cr.id = ri.role_id
       WHERE ri.run_id = $1
       ORDER BY ri.final_score DESC, ri.competency_score DESC, cr.title ASC`,
      [runId]
    );

    const items = itemsRes.rows.map((r) => {
      const explanation = parseJsonMaybe(r.explanation);
      return {
        role_id: Number(r.role_id),
        title: r.title,
        description: r.description,
        competency_score: Number(r.competency_score || 0),
        preference_bonus: Number(r.preference_bonus || 0),
        final_score: Number(r.final_score || 0),
        explanation,
      };
    });

    res.json({ run: runRes.rows[0], items });
  } catch (err) {
    next(err);
  }
});

module.exports = router;