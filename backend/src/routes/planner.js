const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth_middleware");

const router = express.Router();

const PLAN_TYPE = "learning_plan";

const {
  safeNum,
  clamp,
  statusOrder,
  hashString,
  pickMany,
  normalizeSkillName,
  presetForSkill,
  tasksFor,
  evidenceSuggestion,
  priorityScore,
  buildPlan,
} = require("../utils/planner_logic");

async function getRoleTitle(roleId) {
  const { rows } = await pool.query(
    `SELECT id, title, description, entry_level
     FROM career_roles
     WHERE id = $1`,
    [roleId]
  );
  return rows[0] || null;
}

async function computeGap(userId, roleId) {
  const q = `
    SELECT
      rs.skill_id,
      s.name,
      s.category,
      rs.required_level,
      rs.importance,
      COALESCE(us.proficiency_level, 0) AS user_level,
      CASE
        WHEN us.skill_id IS NULL THEN 'missing'
        WHEN us.proficiency_level >= rs.required_level THEN 'matched'
        ELSE 'partial'
      END AS status
    FROM role_skills rs
    JOIN skills s ON s.id = rs.skill_id
    LEFT JOIN user_skills us
      ON us.user_id = $2 AND us.skill_id = rs.skill_id
    WHERE rs.role_id = $1
  `;

  const { rows } = await pool.query(q, [roleId, userId]);

  rows.sort((a, b) => {
    const sa = statusOrder(a.status);
    const sb = statusOrder(b.status);
    if (sa !== sb) return sa - sb;

    const ra = safeNum(a.required_level, 1);
    const rb = safeNum(b.required_level, 1);
    if (ra !== rb) return rb - ra;

    const wa = safeNum(a.importance, 1);
    const wb = safeNum(b.importance, 1);
    if (wa !== wb) return wb - wa;

    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  const totalWeight = rows.reduce((acc, r) => acc + safeNum(r.importance, 1), 0);

  const earned = rows.reduce((acc, r) => {
    const w = safeNum(r.importance, 1);
    const req = clamp(safeNum(r.required_level, 1), 1, 5);
    const have = clamp(safeNum(r.user_level, 0), 0, 5);
    const ratio = Math.min(have / req, 1);
    return acc + ratio * w;
  }, 0);

  const progressPct = totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;

  const summary = {
    total: rows.length,
    matched: rows.filter((r) => r.status === "matched").length,
    partial: rows.filter((r) => r.status === "partial").length,
    missing: rows.filter((r) => r.status === "missing").length,
    progressPct,
  };

  return { summary, items: rows };
}


router.get("/gap/:roleId", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const roleId = Number(req.params.roleId);

  if (!roleId) return res.status(400).json({ error: "Invalid roleId" });

  const role = await getRoleTitle(roleId);
  if (!role) return res.status(404).json({ error: "Role not found" });

  const gap = await computeGap(userId, roleId);

  res.json({
    role,
    summary: gap.summary,
    items: gap.items,
  });
});

router.post("/plan", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const roleId = Number(req.body?.role_id);
  const weeks = Number(req.body?.weeks ?? 4);
  const save = req.body?.save !== false;

  if (!roleId) return res.status(400).json({ error: "role_id is required" });

  const role = await getRoleTitle(roleId);
  if (!role) return res.status(404).json({ error: "Role not found" });

  const gap = await computeGap(userId, roleId);
  const plan = buildPlan(gap.items, weeks, role.title);


  const details = {
    role_id: role.id,
    role_title: role.title,
    weeks: plan.weeks,
    gap_summary: gap.summary,
    weeks_data: plan.weeks_data,
  };

  let saved_entry_id = null;

  if (save) {
    const ins = await pool.query(
      `INSERT INTO progress_entries (user_id, type, details)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [userId, "learning_plan", details]
    );
    saved_entry_id = ins.rows[0]?.id || null;
  }

  res.json({
    role,
    gap,
    plan: details,
    saved_entry_id,
  });
});

router.delete("/plans/:id", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const id = Number(req.params.id);

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid plan id" });
  }

  try {
    const q = `
      DELETE FROM progress_entries
      WHERE id = $1 AND user_id = $2 AND type = $3
      RETURNING id
    `;
    const out = await pool.query(q, [id, userId, PLAN_TYPE]);

    if (!out.rowCount) {
      return res.status(404).json({ error: "Plan not found" });
    }

    return res.json({ ok: true, deleted_id: out.rows[0].id });
  } catch (e) {
    console.error("Delete plan failed:", e);
    return res.status(500).json({ error: "Failed to delete plan" });
  }
});

router.get("/plans", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const { rows } = await pool.query(
    `SELECT
       id,
       created_at,
       details->>'role_title' AS role_title,
       (details->>'weeks')::int AS weeks,
       (details->'gap_summary'->>'progressPct')::int AS progress_pct
     FROM progress_entries
     WHERE user_id = $1 AND type = 'learning_plan'
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );

  res.json(rows);
});

router.get("/plans/:id", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  const { rows } = await pool.query(
    `SELECT id, created_at, details
     FROM progress_entries
     WHERE user_id = $1 AND type = 'learning_plan' AND id = $2`,
    [userId, id]
  );

  const row = rows[0];
  if (!row) return res.status(404).json({ error: "Not found" });

  res.json(row);
});

module.exports = router;
