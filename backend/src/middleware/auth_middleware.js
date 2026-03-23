const jwt = require("jsonwebtoken");

/**
 * Express middleware that enforces authentication on protected routes.
 *
 * Reads a JWT from the HttpOnly cookie set at login. The cookie name is
 * configurable via COOKIE_NAME and falls back to "access_token". If the
 * token is missing or fails verification, the request is rejected with 401.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
function requireAuth(req, res, next) {
    const token = req.cookies?.[process.env.COOKIE_NAME || "access_token"];
    if (!token)
        return res.status(401).json({ error: "Not authenticated" });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        // The JWT sub claim is always a string; store it as-is on req.user.
        req.user = { id: payload.sub };
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}

module.exports = { requireAuth };