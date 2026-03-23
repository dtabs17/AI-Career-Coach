/**
 * Unit tests for the recommendation scoring utilities.
 */

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

const { hashSnapshot } = require("../utils/hash");




// Minimal fixture builder used across scoring scenarios to keep the tests
// focused on the values that actually affect the ranking logic.
function makeRole(id, title, reqs) {
  return {
    role_id: id,
    title,
    reqs: reqs.map((r, i) => ({
      skill_id:      r.skill_id ?? i + 1,
      skill_name:    r.skill_name ?? `Skill ${i + 1}`,
      skill_name_lc: (r.skill_name ?? `skill ${i + 1}`).toLowerCase(),
      category:      r.category ?? "General",
      required_level: r.required_level,
      importance:     r.importance,
    })),
  };
}


// Reusable empty preference set for tests that should exercise pure skill
// scoring without profile-driven bonuses.
const NO_PREFS = {
  preferredRolesSet: new Set(),
  preferredTechSet:  new Set(),
};






describe("clamp()", () => {
  test("returns the value unchanged when it is within bounds", () => {
    expect(clamp(3, 1, 5)).toBe(3);
  });

  test("returns min when value is below the lower bound", () => {
    expect(clamp(-1, 0, 5)).toBe(0);
  });

  test("returns max when value exceeds the upper bound", () => {
    expect(clamp(10, 0, 5)).toBe(5);
  });

  test("returns the boundary value when equal to min", () => {
    expect(clamp(0, 0, 5)).toBe(0);
  });

  test("returns the boundary value when equal to max", () => {
    expect(clamp(5, 0, 5)).toBe(5);
  });
});


describe("round1()", () => {
  test("rounds to one decimal place", () => {
    expect(round1(70.05)).toBe(70.1);
  });

  test("leaves a clean decimal unchanged", () => {
    expect(round1(50.0)).toBe(50);
  });

  test("handles zero correctly", () => {
    expect(round1(0)).toBe(0);
  });
});


describe("normalizeStringArray()", () => {
  test("returns an empty array for null input", () => {
    expect(normalizeStringArray(null)).toEqual([]);
  });

  test("returns an empty array for an empty string", () => {
    expect(normalizeStringArray("")).toEqual([]);
  });

  test("passes through a plain array with whitespace trimmed", () => {
    expect(normalizeStringArray(["  React ", "Node.js"])).toEqual(["React", "Node.js"]);
  });

  test("parses a JSON-encoded string array correctly", () => {
    expect(normalizeStringArray('["Python","JavaScript"]')).toEqual(["Python", "JavaScript"]);
  });

  test("splits a comma-separated string when JSON parsing fails", () => {
    expect(normalizeStringArray("Python, JavaScript, SQL")).toEqual(["Python", "JavaScript", "SQL"]);
  });

  test("filters out empty string elements", () => {
    expect(normalizeStringArray(["React", "", "  "])).toEqual(["React"]);
  });
});


describe("toLowerSet()", () => {
  test("builds a lowercase Set from the input array", () => {
    const set = toLowerSet(["React", "NODE.JS"]);
    expect(set.has("react")).toBe(true);
    expect(set.has("node.js")).toBe(true);
  });

  test("returns an empty Set for an empty array", () => {
    expect(toLowerSet([]).size).toBe(0);
  });

  test("returns an empty Set for null input", () => {
    expect(toLowerSet(null).size).toBe(0);
  });
});






describe("scoreRole() - competency score calculation", () => {

  test("calculates the correct weighted competency score for a mixed-proficiency profile", () => {
    
    const role = makeRole(1, "Web Developer", [
      { skill_id: 1, skill_name: "JavaScript", required_level: 4, importance: 2 },
      { skill_id: 2, skill_name: "SQL",        required_level: 2, importance: 3 },
    ]);

    const userSkillMap = new Map([[1, 4], [2, 1]]);
    const result = scoreRole({ role, userSkillMap, ...NO_PREFS });

    expect(result.competency_score).toBe(70.0);
    expect(result.final_score).toBe(70.0);
    expect(result.preference_bonus).toBe(0);
  });


  test("returns competency_score 100.0 when all skills are met at exactly the required level", () => {
    
    const role = makeRole(2, "Backend Engineer", [
      { skill_id: 1, skill_name: "Python", required_level: 3, importance: 2 },
      { skill_id: 2, skill_name: "SQL",    required_level: 2, importance: 3 },
    ]);

    const userSkillMap = new Map([[1, 3], [2, 2]]);
    const result = scoreRole({ role, userSkillMap, ...NO_PREFS });

    expect(result.competency_score).toBe(100.0);
    expect(result.final_score).toBe(100.0);
  });


  test("returns competency_score 0.0 when the user has none of the required skills", () => {
    
    const role = makeRole(3, "Data Analyst", [
      { skill_id: 1, skill_name: "R",      required_level: 3, importance: 2 },
      { skill_id: 2, skill_name: "Tableau", required_level: 2, importance: 2 },
    ]);

    const userSkillMap = new Map();
    const result = scoreRole({ role, userSkillMap, ...NO_PREFS });

    expect(result.competency_score).toBe(0.0);
    expect(result.final_score).toBe(0.0);
  });


  test("handles a single-skill role and scores it correctly", () => {
    
    const role = makeRole(4, "Junior Developer", [
      { skill_id: 1, skill_name: "Git", required_level: 3, importance: 1 },
    ]);

    const userSkillMap = new Map([[1, 3]]);
    const result = scoreRole({ role, userSkillMap, ...NO_PREFS });

    expect(result.competency_score).toBe(100.0);
  });


  test("a user skill above the required level earns full points, not extra points", () => {
    
    const role = makeRole(5, "Systems Admin", [
      { skill_id: 1, skill_name: "Linux", required_level: 2, importance: 3 },
    ]);

    const userSkillMap = new Map([[1, 5]]);
    const result = scoreRole({ role, userSkillMap, ...NO_PREFS });

    expect(result.competency_score).toBe(100.0);
  });

});






describe("scoreRole() - skill categorisation", () => {

  
  const categRole = makeRole(10, "DevOps Engineer", [
    { skill_id: 1, skill_name: "Docker",     required_level: 3, importance: 2 },
    { skill_id: 2, skill_name: "Kubernetes", required_level: 4, importance: 3 },
    { skill_id: 3, skill_name: "Terraform",  required_level: 2, importance: 2 },
  ]);

  test("classifies a skill as matched when user level meets the required level exactly", () => {
    
    const userSkillMap = new Map([[1, 3], [2, 0], [3, 0]]);
    const { explanation } = scoreRole({ role: categRole, userSkillMap, ...NO_PREFS });

    expect(explanation.matched.length).toBe(1);
    expect(explanation.matched[0].name).toBe("Docker");
    expect(explanation.summary.matched_count).toBe(1);
  });

  test("classifies a skill as matched when user level exceeds the required level", () => {
    
    const userSkillMap = new Map([[1, 5], [2, 0], [3, 0]]);
    const { explanation } = scoreRole({ role: categRole, userSkillMap, ...NO_PREFS });

    expect(explanation.matched[0].name).toBe("Docker");
    expect(explanation.matched[0].user_level).toBe(5);
  });

  test("classifies a skill as partial when user has some proficiency but below the required level", () => {
    
    const userSkillMap = new Map([[1, 0], [2, 2], [3, 0]]);
    const { explanation } = scoreRole({ role: categRole, userSkillMap, ...NO_PREFS });

    expect(explanation.partial.length).toBe(1);
    expect(explanation.partial[0].name).toBe("Kubernetes");
    expect(explanation.summary.partial_count).toBe(1);
  });

  test("classifies a skill as missing when user level is zero", () => {
    
    const userSkillMap = new Map([[1, 0], [2, 0], [3, 0]]);
    const { explanation } = scoreRole({ role: categRole, userSkillMap, ...NO_PREFS });

    expect(explanation.missing.length).toBe(3);
    expect(explanation.summary.missing_count).toBe(3);
  });

  test("places each skill into exactly one category across a mixed profile", () => {
    
    const userSkillMap = new Map([[1, 3], [2, 2], [3, 0]]);
    const { explanation } = scoreRole({ role: categRole, userSkillMap, ...NO_PREFS });

    expect(explanation.matched.length).toBe(1);
    expect(explanation.partial.length).toBe(1);
    expect(explanation.missing.length).toBe(1);

    expect(explanation.matched[0].name).toBe("Docker");
    expect(explanation.partial[0].name).toBe("Kubernetes");
    expect(explanation.missing[0].name).toBe("Terraform");

    expect(explanation.summary.total_required).toBe(3);
  });

});






describe("scoreRole() - preference bonuses", () => {
  const bonusRole = makeRole(20, "Software Engineer", [
    { skill_id: 1, skill_name: "Python", skill_name_lc: "python", required_level: 2, importance: 2 },
  ]);
  const baseMap = new Map([[1, 1]]);


  test("applies the preferred role bonus of +6 when the role title is in the user's preferred roles", () => {
    const preferredRolesSet = toLowerSet(["Software Engineer"]);
    const result = scoreRole({
      role: bonusRole,
      userSkillMap: baseMap,
      preferredRolesSet,
      preferredTechSet: new Set(),
    });

    expect(result.preference.is_preferred_role).toBe(true);
    expect(result.preference_bonus).toBe(6);
    expect(result.final_score).toBe(56.0);
  });


  test("does not apply the preferred role bonus when the role title is not in the user's preferred roles", () => {
    const result = scoreRole({ role: bonusRole, userSkillMap: baseMap, ...NO_PREFS });

    expect(result.preference.is_preferred_role).toBe(false);
    expect(result.preference_bonus).toBe(0);
    expect(result.final_score).toBe(50.0);
  });


  test("preferred role matching is case-insensitive", () => {
    const preferredRolesSet = new Set(["software engineer"]);
    const result = scoreRole({
      role: bonusRole,
      userSkillMap: baseMap,
      preferredRolesSet,
      preferredTechSet: new Set(),
    });

    expect(result.preference.is_preferred_role).toBe(true);
  });


  test("applies a tech overlap bonus of +1 per matching technology, up to a maximum of 4", () => {
    const result = scoreRole({
      role: bonusRole,
      userSkillMap: baseMap,
      preferredRolesSet: new Set(),
      preferredTechSet: new Set(["python"]),
    });

    expect(result.preference.tech_overlap_count).toBe(1);
    expect(result.preference_bonus).toBe(1);
    expect(result.final_score).toBe(51.0);
  });


  test("caps the tech overlap bonus at MAX_TECH_BONUS (4) even when more than 4 technologies overlap", () => {
    const manyTechRole = makeRole(21, "Full Stack Developer", [
      { skill_id: 1, skill_name: "React",      skill_name_lc: "react",      required_level: 2, importance: 1 },
      { skill_id: 2, skill_name: "Node.js",    skill_name_lc: "node.js",    required_level: 2, importance: 1 },
      { skill_id: 3, skill_name: "Python",     skill_name_lc: "python",     required_level: 2, importance: 1 },
      { skill_id: 4, skill_name: "SQL",        skill_name_lc: "sql",        required_level: 2, importance: 1 },
      { skill_id: 5, skill_name: "Docker",     skill_name_lc: "docker",     required_level: 2, importance: 1 },
      { skill_id: 6, skill_name: "Kubernetes", skill_name_lc: "kubernetes", required_level: 2, importance: 1 },
    ]);

    const sixSkillMap = new Map([[1,1],[2,1],[3,1],[4,1],[5,1],[6,1]]);
    const allSixInSet = new Set(["react","node.js","python","sql","docker","kubernetes"]);

    const result = scoreRole({
      role: manyTechRole,
      userSkillMap: sixSkillMap,
      preferredRolesSet: new Set(),
      preferredTechSet: allSixInSet,
    });

    expect(result.preference.tech_overlap_count).toBe(6);
    expect(result.preference_bonus).toBe(MAX_TECH_BONUS);
    expect(result.final_score).toBe(54.0);
  });


  test("total bonus is capped at MAX_TOTAL_BONUS (10) and final_score is capped at 100", () => {
    const capRole = makeRole(22, "Cloud Architect", [
      { skill_id: 1, skill_name: "AWS",         skill_name_lc: "aws",         required_level: 2, importance: 1 },
      { skill_id: 2, skill_name: "Azure",        skill_name_lc: "azure",       required_level: 2, importance: 1 },
      { skill_id: 3, skill_name: "Terraform",    skill_name_lc: "terraform",   required_level: 2, importance: 1 },
    ]);

    const fullMap = new Map([[1,2],[2,2],[3,2]]);
    const threeOverlap = new Set(["aws","azure","terraform"]);
    const preferCloudArch = new Set(["cloud architect"]);

    const result = scoreRole({
      role: capRole,
      userSkillMap: fullMap,
      preferredRolesSet: preferCloudArch,
      preferredTechSet: threeOverlap,
    });

    expect(result.competency_score).toBe(100.0);
    expect(result.preference.is_preferred_role).toBe(true);
    expect(result.preference.tech_overlap_count).toBe(3);
    expect(result.preference_bonus).toBe(9);
    expect(result.final_score).toBe(100); 
  });

});


describe("scoreRole() - edge cases", () => {

  test("scores a role with zero required skills as 0 competency with an empty explanation", () => {
    const emptyRole = { role_id: 99, title: "Unknown Role", reqs: [] };
    const result = scoreRole({ role: emptyRole, userSkillMap: new Map(), ...NO_PREFS });

    expect(result.competency_score).toBe(0);
    expect(result.final_score).toBe(0);
    expect(result.explanation.summary.total_required).toBe(0);
  });

  test("importance values are clamped to the range 1-5, rejecting out-of-range inputs", () => {
    const role = makeRole(30, "Tester", [
      { skill_id: 1, skill_name: "Selenium", required_level: 2, importance: 10 },
    ]);

    const result = scoreRole({ role, userSkillMap: new Map([[1, 2]]), ...NO_PREFS });
    expect(result.competency_score).toBe(100.0);
  });

  test("required_level values are clamped to 1-5, so a required_level of 0 does not produce division by zero", () => {
    const role = makeRole(31, "Intern", [
      { skill_id: 1, skill_name: "HTML", required_level: 0, importance: 1 },
    ]);

    expect(() => {
      scoreRole({ role, userSkillMap: new Map([[1, 1]]), ...NO_PREFS });
    }).not.toThrow();
  });

});


describe("sortBestFit()", () => {

  test("sorts by competency_score descending as the primary key", () => {
    const roles = [
      { title: "A", competency_score: 60, final_score: 70 },
      { title: "B", competency_score: 80, final_score: 80 },
      { title: "C", competency_score: 40, final_score: 90 },
    ];
    const sorted = sortBestFit(roles);
    expect(sorted.map(r => r.title)).toEqual(["B", "A", "C"]);
  });

  test("uses final_score as a tiebreaker when competency_score is equal", () => {
    const roles = [
      { title: "A", competency_score: 70, final_score: 70 },
      { title: "B", competency_score: 70, final_score: 76 },
    ];
    const sorted = sortBestFit(roles);
    expect(sorted[0].title).toBe("B");
  });

  test("uses alphabetical title order as the final tiebreaker", () => {
    const roles = [
      { title: "Zebra Role",  competency_score: 70, final_score: 76 },
      { title: "Alpha Role",  competency_score: 70, final_score: 76 },
    ];
    const sorted = sortBestFit(roles);
    expect(sorted[0].title).toBe("Alpha Role");
  });

  test("does not mutate the original array", () => {
    const roles = [
      { title: "A", competency_score: 40, final_score: 40 },
      { title: "B", competency_score: 80, final_score: 80 },
    ];
    const original = [...roles];
    sortBestFit(roles);
    expect(roles).toEqual(original);
  });

});


describe("sortBestFitPlus()", () => {

  test("sorts by final_score descending as the primary key", () => {
    const roles = [
      { title: "A", competency_score: 80, final_score: 70 },
      { title: "B", competency_score: 60, final_score: 90 },
    ];
    const sorted = sortBestFitPlus(roles);
    expect(sorted[0].title).toBe("B");
  });

  test("uses competency_score as a tiebreaker when final_score is equal", () => {
    const roles = [
      { title: "A", competency_score: 50, final_score: 80 },
      { title: "B", competency_score: 70, final_score: 80 },
    ];
    const sorted = sortBestFitPlus(roles);
    expect(sorted[0].title).toBe("B");
  });

});


describe("hashSnapshot()", () => {

  const baseSnapshot = {
    top_n: 10,
    skills: [
      { skill_id: 1, proficiency_level: 3 },
      { skill_id: 2, proficiency_level: 2 },
    ],
    profile: {
      academic_focus: "Software Engineering",
      preferred_technologies: ["Python", "React"],
      preferred_roles: ["Software Engineer"],
    },
    algo: {
      version: "v2-preferences",
      preferred_role_bonus: 6,
      max_tech_bonus: 4,
      max_total_bonus: 10,
    },
  };


  test("produces a 64-character hex SHA-256 string", () => {
    const hash = hashSnapshot(baseSnapshot);
    expect(typeof hash).toBe("string");
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });

  test("returns the same hash for identical inputs (idempotency)", () => {
    const hash1 = hashSnapshot(baseSnapshot);
    const hash2 = hashSnapshot(baseSnapshot);
    expect(hash1).toBe(hash2);
  });

  test("produces a different hash when the skill proficiency level changes", () => {
    const modified = JSON.parse(JSON.stringify(baseSnapshot));
    modified.skills[0].proficiency_level = 5;
    expect(hashSnapshot(modified)).not.toBe(hashSnapshot(baseSnapshot));
  });

  test("produces a different hash when a new skill is added", () => {
    const modified = JSON.parse(JSON.stringify(baseSnapshot));
    modified.skills.push({ skill_id: 3, proficiency_level: 1 });
    expect(hashSnapshot(modified)).not.toBe(hashSnapshot(baseSnapshot));
  });

  test("produces a different hash when a preferred role changes", () => {
    const modified = JSON.parse(JSON.stringify(baseSnapshot));
    modified.profile.preferred_roles = ["Data Scientist"];
    expect(hashSnapshot(modified)).not.toBe(hashSnapshot(baseSnapshot));
  });

  test("produces the same hash regardless of property insertion order (canonical serialisation)", () => {
    const snapshot1 = { top_n: 5, skills: [{ skill_id: 1, proficiency_level: 3 }] };
    const snapshot2 = { skills: [{ skill_id: 1, proficiency_level: 3 }], top_n: 5 };
    expect(hashSnapshot(snapshot1)).toBe(hashSnapshot(snapshot2));
  });

});