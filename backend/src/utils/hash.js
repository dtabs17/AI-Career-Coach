const crypto = require("crypto");

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

function hashSnapshot(snapshot) {
    const canonical = canonicalJson(snapshot);
    const json = JSON.stringify(canonical);
    return crypto.createHash("sha256").update(json).digest("hex");
}

module.exports = { hashSnapshot };
