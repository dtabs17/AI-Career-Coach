const router = require("express").Router();
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { hashSnapshot } = require("../utils/hash");

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function normalizeStringArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((v) => String(v || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v || "").trim()).filter(Boolean);
      }
    } catch {
      return s.split(",").map((v) => v.trim()).filter(Boolean);
    }
  }

  return [];
}

function toLowerSet(arr) {
  const set = new Set();
  for (const v of arr || []) set.add(String(v).toLowerCase());
  return set;
}

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

function sortBestFit(arr) {
  return [...arr].sort((a, b) => {
    if (b.competency_score !== a.competency_score) return b.competency_score - a.competency_score;
    if (b.final_score !== a.final_score) return b.final_score - a.final_score;
    return String(a.title).localeCompare(String(b.title));
  });
}

function sortBestFitPlus(arr) {
  return [...arr].sort((a, b) => {
    if (b.final_score !== a.final_score) return b.final_score - a.final_score;
    if (b.competency_score !== a.competency_score) return b.competency_score - a.competency_score;
    return String(a.title).localeCompare(String(b.title));
  });
}

router.post("/run", requireAuth, async (req, res, next) => {
  const userId = req.user.id;
  const topN = clamp(Number(req.body?.top_n ?? 10), 1, 25);

  const algoVersion = "v2-preferences";

  const PREFERRED_ROLE_BONUS = 6;
  const MAX_TECH_BONUS = 4;
  const MAX_TOTAL_BONUS = 10;

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

    const runRes = await client.query(
      `INSERT INTO recommendation_runs (user_id, input_snapshot, input_hash, algo_version)
       VALUES ($1, $2::json, $3, $4)
       ON CONFLICT (user_id, input_hash, algo_version)
       DO UPDATE SET created_at = recommendation_runs.created_at
       RETURNING id, user_id, created_at, input_snapshot, input_hash, algo_version, (xmax = 0) AS inserted`,
      [userId, JSON.stringify(inputSnapshot), inputHash, algoVersion]
    );

    const run = runRes.rows[0];
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
      let totalPossible = 0;
      let totalEarned = 0;

      const matched = [];
      const partial = [];
      const missing = [];

      const overlapNames = [];

      for (const req of role.reqs) {
        const importance = clamp(req.importance, 1, 5);
        const required = clamp(req.required_level, 1, 5);
        const userLevel = clamp(Number(userSkillMap.get(req.skill_id) || 0), 0, 5);

        totalPossible += importance;

        const ratio = required > 0 ? clamp(userLevel / required, 0, 1) : 0;
        totalEarned += ratio * importance;

        if (preferredTechSet.has(req.skill_name_lc)) overlapNames.push(req.skill_name);

        if (userLevel >= required) {
          matched.push({ name: req.skill_name, category: req.category, user_level: userLevel, required_level: required, importance });
        } else if (userLevel > 0) {
          partial.push({ name: req.skill_name, category: req.category, user_level: userLevel, required_level: required, importance });
        } else {
          missing.push({ name: req.skill_name, category: req.category, required_level: required, importance });
        }
      }

      const competencyScore = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
      const competencyRounded = round1(competencyScore);

      const isPreferredRole = preferredRolesSet.has(String(role.title || "").toLowerCase());
      const techOverlapCount = overlapNames.length;

      const roleBonus = isPreferredRole ? PREFERRED_ROLE_BONUS : 0;
      const techBonus = clamp(Math.min(MAX_TECH_BONUS, techOverlapCount), 0, MAX_TECH_BONUS);

      const preferenceBonus = clamp(roleBonus + techBonus, 0, MAX_TOTAL_BONUS);
      const finalScore = clamp(competencyRounded + preferenceBonus, 0, 100);

      const preference = {
        is_preferred_role: isPreferredRole,
        tech_overlap_count: techOverlapCount,
        tech_overlap_names: overlapNames.slice(0, 12),
      };

      scoredAll.push({
        role_id: role.role_id,
        title: role.title,
        description: role.description,
        entry_level: role.entry_level,
        competency_score: competencyRounded,
        preference_bonus: round1(preferenceBonus),
        final_score: round1(finalScore),
        preference,
        explanation: {
          matched,
          partial,
          missing,
          summary: {
            matched_count: matched.length,
            partial_count: partial.length,
            missing_count: missing.length,
            total_required: role.reqs.length,
          },
        },
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
    } catch {}
    next(err);
  } finally {
    client.release();
  }
});

router.get("/runs", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      `SELECT id, user_id, created_at, algo_version, input_hash
       FROM recommendation_runs
       WHERE user_id = $1
       ORDER BY created_at DESC
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
