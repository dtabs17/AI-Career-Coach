/**
 * Unit tests for deterministic planner helpers and plan generation.
 */

const {
  safeNum,
  clamp,
  statusOrder,
  hashString,
  pickMany,
  presetForSkill,
  priorityScore,
  buildPlan,
  tasksFor,
} = require("../utils/planner_logic");


describe("safeNum()", () => {
  test("returns the numeric value for a valid number", () => {
    expect(safeNum(4)).toBe(4);
  });

  test("returns the fallback for NaN input", () => {
    expect(safeNum(NaN, 1)).toBe(1);
  });

  test("returns the fallback for a non-numeric string", () => {
    expect(safeNum("abc", 0)).toBe(0);
  });

  test("returns 0 as default fallback when no fallback is supplied", () => {
    expect(safeNum("bad")).toBe(0);
  });
});


describe("statusOrder()", () => {
  test("missing has the lowest order value (0)", () => {
    expect(statusOrder("missing")).toBe(0);
  });

  test("partial has order value 1", () => {
    expect(statusOrder("partial")).toBe(1);
  });

  test("any other status (including matched) has the highest order value (2)", () => {
    expect(statusOrder("matched")).toBe(2);
    expect(statusOrder("unknown")).toBe(2);
  });
});


describe("hashString()", () => {
  test("returns a number", () => {
    expect(typeof hashString("test")).toBe("number");
  });

  test("produces the same value for identical inputs (deterministic)", () => {
    expect(hashString("hello")).toBe(hashString("hello"));
  });

  test("produces different values for different inputs", () => {
    expect(hashString("aaa")).not.toBe(hashString("bbb"));
  });

  test("handles an empty string without throwing", () => {
    expect(() => hashString("")).not.toThrow();
    expect(hashString("")).toBe(2166136261);
  });

  test("returns an unsigned 32-bit integer (0 to 2^32 - 1)", () => {
    const h = hashString("some long seed string for testing");
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(4294967295);
  });
});

// The planner uses seeded selection for repeatable task suggestions, so these
// tests lock down determinism and uniqueness explicitly.
describe("pickMany()", () => {
  const LIST = ["alpha", "beta", "gamma", "delta", "epsilon"];

  test("returns the requested number of items", () => {
    const result = pickMany(LIST, 2, "seed-a");
    expect(result.length).toBe(2);
  });

  test("returns no duplicate items within a single call", () => {
    const result = pickMany(LIST, 4, "seed-b");
    expect(new Set(result).size).toBe(result.length);
  });

  test("produces identical results for identical inputs (deterministic)", () => {
    const r1 = pickMany(LIST, 3, "my-seed");
    const r2 = pickMany(LIST, 3, "my-seed");
    expect(r1).toEqual(r2);
  });

  test("produces different results for different seed strings", () => {
    const r1 = pickMany(LIST, 3, "seed-x");
    const r2 = pickMany(LIST, 3, "seed-y");
    expect(r1.join(",")).not.toBe(r2.join(","));
  });

  test("returns all items (no duplicates) when count exceeds list length", () => {
    const result = pickMany(["a", "b"], 10, "over");
    expect(result.length).toBe(2);
    expect(new Set(result).size).toBe(2);
  });

  test("returns an empty array for an empty input list", () => {
    expect(pickMany([], 5, "seed")).toEqual([]);
  });

  test("returns an empty array for a null input list", () => {
    expect(pickMany(null, 2, "seed")).toEqual([]);
  });
});


describe("presetForSkill()", () => {
  test("returns a preset for a SQL-related skill name", () => {
    expect(presetForSkill("PostgreSQL")).not.toBeNull();
  });

  test("returns a preset for a REST-related skill name", () => {
    expect(presetForSkill("RESTful API design")).not.toBeNull();
  });

  test("returns a preset for an auth-related skill name", () => {
    expect(presetForSkill("JWT Authentication")).not.toBeNull();
  });

  test("returns null for an unrecognised skill name", () => {
    expect(presetForSkill("Quantum origami")).toBeNull();
  });

  test("each preset contains learn, build, quality, and evidence arrays", () => {
    const preset = presetForSkill("PostgreSQL");
    expect(Array.isArray(preset.learn)).toBe(true);
    expect(Array.isArray(preset.build)).toBe(true);
    expect(Array.isArray(preset.quality)).toBe(true);
    expect(Array.isArray(preset.evidence)).toBe(true);
  });

  test("preset arrays are non-empty", () => {
    const preset = presetForSkill("unit testing");
    expect(preset.learn.length).toBeGreaterThan(0);
    expect(preset.build.length).toBeGreaterThan(0);
  });
});

describe("priorityScore()", () => {
  test("missing skill scores 134 for importance=3 and required_level=4", () => {
    expect(priorityScore({ status: "missing", importance: 3, required_level: 4 })).toBe(134);
  });

  test("partial skill scores 73 for importance=2 and required_level=3", () => {
    expect(priorityScore({ status: "partial", importance: 2, required_level: 3 })).toBe(73);
  });

  test("matched skill scores 55 for importance=5 and required_level=5", () => {
    expect(priorityScore({ status: "matched", importance: 5, required_level: 5 })).toBe(55);
  });

  test("a missing skill always outranks a partial skill at the same importance", () => {
    const missing = { status: "missing", importance: 1, required_level: 1 };
    const partial  = { status: "partial",  importance: 5, required_level: 5 };
    expect(priorityScore(missing)).toBeGreaterThan(priorityScore(partial));
  });

  test("a partial skill always outranks a matched skill at the same importance", () => {
    const partial  = { status: "partial",  importance: 1, required_level: 1 };
    const matched  = { status: "matched",  importance: 5, required_level: 5 };
    expect(priorityScore(partial)).toBeGreaterThan(priorityScore(matched));
  });
});

describe("buildPlan()", () => {
  const DOCKER     = { skill_id: 1, name: "Docker",     category: "DevOps", status: "missing", required_level: 3, user_level: 0, importance: 3 };
  const KUBERNETES = { skill_id: 2, name: "Kubernetes", category: "DevOps", status: "partial",  required_level: 4, user_level: 2, importance: 2 };
  const PYTHON     = { skill_id: 3, name: "Python",     category: "Lang",   status: "matched",  required_level: 2, user_level: 3, importance: 3 };


  test("returns the correct number of week entries", () => {
    const plan = buildPlan([DOCKER, KUBERNETES], 2, "DevOps Engineer");
    expect(plan.weeks).toBe(2);
    expect(plan.weeks_data.length).toBe(2);
  });

  test("places the highest-priority missing skill into week 1", () => {
    const plan = buildPlan([DOCKER, KUBERNETES], 2, "DevOps Engineer");
    expect(plan.weeks_data[0].items[0].name).toBe("Docker");
  });

  test("places the next-priority skill into week 2 via round-robin distribution", () => {
    const plan = buildPlan([DOCKER, KUBERNETES], 2, "DevOps Engineer");
    expect(plan.weeks_data[1].items[0].name).toBe("Kubernetes");
  });

  test("excludes matched skills from the plan entirely", () => {
    const plan = buildPlan([DOCKER, KUBERNETES, PYTHON], 2, "DevOps Engineer");
    const allNames = plan.weeks_data.flatMap(w => w.items.map(i => i.name));
    expect(allNames).not.toContain("Python");
  });

  test("assigns 3 estimated hours to missing skills and 2 to partial skills", () => {
    const plan = buildPlan([DOCKER, KUBERNETES], 2, "DevOps Engineer");
    const dockerItem = plan.weeks_data[0].items.find(i => i.name === "Docker");
    const k8sItem    = plan.weeks_data[1].items.find(i => i.name === "Kubernetes");
    expect(dockerItem.estimated_hours).toBe(3);
    expect(k8sItem.estimated_hours).toBe(2);
  });

  test("missing skills receive 4 suggested tasks (3 tasks + 1 target line)", () => {
    const plan = buildPlan([DOCKER], 1, "DevOps Engineer");
    expect(plan.weeks_data[0].items[0].suggested_tasks.length).toBe(4);
  });

  test("partial skills receive 3 suggested tasks", () => {
    const plan = buildPlan([KUBERNETES], 1, "DevOps Engineer");
    expect(plan.weeks_data[0].items[0].suggested_tasks.length).toBe(3);
  });

  test("plan generation is deterministic: identical inputs produce identical output", () => {
    const plan1 = buildPlan([DOCKER, KUBERNETES], 4, "DevOps Engineer");
    const plan2 = buildPlan([DOCKER, KUBERNETES], 4, "DevOps Engineer");
    expect(JSON.stringify(plan1)).toBe(JSON.stringify(plan2));
  });

  test("clamps weeks to a minimum of 1", () => {
    expect(buildPlan([], 0, "Role").weeks).toBe(1);
  });

  test("clamps weeks to a maximum of 24", () => {
    expect(buildPlan([], 100, "Role").weeks).toBe(24);
  });

  test("returns empty item arrays for every week when no gap items are supplied", () => {
    const plan = buildPlan([], 4, "Any Role");
    const allItems = plan.weeks_data.flatMap(w => w.items);
    expect(allItems.length).toBe(0);
  });

  test("each week entry has the correct week_no and title", () => {
    const plan = buildPlan([DOCKER], 3, "Role");
    expect(plan.weeks_data[0].week_no).toBe(1);
    expect(plan.weeks_data[0].title).toBe("Week 1");
    expect(plan.weeks_data[2].week_no).toBe(3);
    expect(plan.weeks_data[2].title).toBe("Week 3");
  });

  test("each item carries through the original skill metadata", () => {
    const plan = buildPlan([DOCKER], 1, "DevOps Engineer");
    const item = plan.weeks_data[0].items[0];
    expect(item.skill_id).toBe(1);
    expect(item.name).toBe("Docker");
    expect(item.category).toBe("DevOps");
    expect(item.status).toBe("missing");
    expect(item.required_level).toBe(3);
    expect(item.user_level).toBe(0);
    expect(item.importance).toBe(3);
  });
});