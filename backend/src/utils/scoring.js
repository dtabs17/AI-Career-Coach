// Maximum bonus added when a role matches one the user explicitly listed as preferred.
const PREFERRED_ROLE_BONUS = 6;
// Maximum bonus for overlap between the user's preferred technologies and the role's required skills.
const MAX_TECH_BONUS       = 4;
// Hard ceiling on the combined preference bonus, preventing it from dominating the competency score.
const MAX_TOTAL_BONUS      = 10;



function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}


/**
 * Normalises a skill or preference list into a plain string array.
 *
 * PostgreSQL JSONB columns can be returned by the pg driver as either a
 * parsed array or a JSON-encoded string depending on how the column was cast
 * in the query. This function handles both forms, and also accepts a plain
 * comma-separated string as a last resort.
 *
 * @param {string|string[]|null} value - Raw value from the database or request body.
 * @returns {string[]} Array of trimmed, non-empty strings.
 */
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


/**
 * Scores a single career role against the user's current skills and preferences.
 *
 * The competency score is a weighted ratio: for each required skill, the user's
 * level is divided by the required level (clamped to 1.0 maximum) and multiplied
 * by the skill's importance weight. Summing earned weights and dividing by total
 * possible weights gives a 0-100 percentage.
 *
 * A preference bonus (capped at MAX_TOTAL_BONUS) is added on top when the role
 * matches the user's preferred roles or technology stack. The final score is
 * clamped to [0, 100].
 *
 * @param {object} params
 * @param {object} params.role - Role object containing a reqs array of skill requirements.
 * @param {Map<number, number>} params.userSkillMap - Map of skill_id to user proficiency level.
 * @param {Set<string>} params.preferredRolesSet - Lowercase set of the user's preferred role titles.
 * @param {Set<string>} params.preferredTechSet - Lowercase set of the user's preferred technologies.
 * @returns {object} Scored role with competency_score, preference_bonus, final_score, and explanation.
 */
function scoreRole({ role, userSkillMap, preferredRolesSet, preferredTechSet }) {
  let totalPossible = 0;
  let totalEarned   = 0;

  const matched      = [];
  const partial      = [];
  const missing      = [];
  const overlapNames = [];

  for (const req of role.reqs) {
    const importance = clamp(req.importance,      1, 5);
    const required   = clamp(req.required_level,  1, 5);
    const userLevel  = clamp(Number(userSkillMap.get(req.skill_id) || 0), 0, 5);

    totalPossible += importance;

    const ratio = required > 0 ? clamp(userLevel / required, 0, 1) : 0;
    totalEarned += ratio * importance;

    if (preferredTechSet.has(req.skill_name_lc)) {
      overlapNames.push(req.skill_name);
    }

    if (userLevel >= required) {
      matched.push({
        name:           req.skill_name,
        category:       req.category,
        user_level:     userLevel,
        required_level: required,
        importance,
      });
    } else if (userLevel > 0) {
      partial.push({
        name:           req.skill_name,
        category:       req.category,
        user_level:     userLevel,
        required_level: required,
        importance,
      });
    } else {
      missing.push({
        name:           req.skill_name,
        category:       req.category,
        required_level: required,
        importance,
      });
    }
  }

  const competencyScore   = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
  const competencyRounded = round1(competencyScore);

  const isPreferredRole   = preferredRolesSet.has(String(role.title || "").toLowerCase());
  const techOverlapCount  = overlapNames.length;

  const roleBonus        = isPreferredRole ? PREFERRED_ROLE_BONUS : 0;
  const techBonus        = clamp(Math.min(MAX_TECH_BONUS, techOverlapCount), 0, MAX_TECH_BONUS);
  const preferenceBonus  = clamp(roleBonus + techBonus, 0, MAX_TOTAL_BONUS);
  const finalScore       = clamp(competencyRounded + preferenceBonus, 0, 100);

  return {
    role_id:          role.role_id,
    title:            role.title,
    competency_score: competencyRounded,
    preference_bonus: round1(preferenceBonus),
    final_score:      round1(finalScore),
    preference: {
      is_preferred_role:  isPreferredRole,
      tech_overlap_count: techOverlapCount,
      tech_overlap_names: overlapNames.slice(0, 12),
    },
    explanation: {
      matched,
      partial,
      missing,
      summary: {
        matched_count:  matched.length,
        partial_count:  partial.length,
        missing_count:  missing.length,
        total_required: role.reqs.length,
      },
    },
  };
}

// Sorts by raw competency score first (skills-only ranking), then final_score as a tiebreaker.
// Used for the "Best fit" view where preference weighting should not affect position.
function sortBestFit(arr) {
  return [...arr].sort((a, b) => {
    if (b.competency_score !== a.competency_score) return b.competency_score - a.competency_score;
    if (b.final_score      !== a.final_score)      return b.final_score      - a.final_score;
    return String(a.title).localeCompare(String(b.title));
  });
}

// Sorts by final_score first (competency + preference bonus), then competency_score as a tiebreaker.
// Used for the "Best fit + preferences" view where preferred roles and tech stack matches rank higher.
function sortBestFitPlus(arr) {
  return [...arr].sort((a, b) => {
    if (b.final_score      !== a.final_score)      return b.final_score      - a.final_score;
    if (b.competency_score !== a.competency_score) return b.competency_score - a.competency_score;
    return String(a.title).localeCompare(String(b.title));
  });
}

module.exports = {
  PREFERRED_ROLE_BONUS,
  MAX_TECH_BONUS,
  MAX_TOTAL_BONUS,
  clamp,
  round1,
  normalizeStringArray,
  toLowerSet,
  scoreRole,
  sortBestFit,
  sortBestFitPlus,
};