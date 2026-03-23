const crypto = require("crypto");

/**
 * Recursively rebuilds a value with all object keys sorted alphabetically.
 * Arrays are preserved in their original order; only object key order changes.
 *
 * Sorting keys ensures that two objects with identical content but different
 * insertion orders produce the same JSON string. This is required for
 * consistent hashing in hashSnapshot, because JavaScript does not guarantee
 * object key order across all environments.
 *
 * @param {*} value - Any JSON-serialisable value.
 * @returns {*} A structurally identical value with all object keys sorted.
 */
function canonicalJson(value) {
    if (Array.isArray(value)) {
        return value.map(canonicalJson);
    }
    if (value && typeof value === "object") {
        const out = {};
        for (const k of Object.keys(value).sort()) out[k] = canonicalJson(value[k]);
        return out;
    }
    return value;
}

/**
 * Produces a SHA-256 hex digest of a canonically serialised snapshot object.
 *
 * Used to deduplicate recommendation runs: if a user runs recommendations with
 * the same skills, profile, and algorithm version as a previous run, the hash
 * will match an existing row in recommendation_runs and the cached result is
 * returned instead of recomputing scores.
 *
 * @param {object} snapshot - The input snapshot object to hash.
 * @returns {string} A 64-character lowercase hex string (SHA-256 digest).
 */
function hashSnapshot(snapshot) {
    const canonical = canonicalJson(snapshot);
    const json = JSON.stringify(canonical);
    return crypto.createHash("sha256").update(json).digest("hex");
}

module.exports = { hashSnapshot };