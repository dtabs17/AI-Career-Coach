const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
    const token = req.cookies?.[process.env.COOKIE_NAME || "access_token"];
    if (!token)
        return res.status(401).json({ error: "Not authenticated" });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.sub };
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}

module.exports = { requireAuth };
