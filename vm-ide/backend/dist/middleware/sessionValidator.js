"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionValidator = sessionValidator;
const sessionStore_1 = require("../sessionStore");
/**
 * Middleware that validates the sessionId parameter exists and points to a valid session.
 * Extracts sessionId from query params, body, or route params.
 */
function sessionValidator(req, res, next) {
    const sessionId = req.query.sessionId ||
        req.body?.sessionId ||
        req.params?.sessionId;
    if (!sessionId) {
        res.status(400).json({ error: "sessionId is required" });
        return;
    }
    const session = (0, sessionStore_1.getSession)(sessionId);
    if (!session) {
        res.status(404).json({ error: "Session not found or expired" });
        return;
    }
    // Attach session to request for downstream use
    req.session = session;
    req.sessionId = sessionId;
    next();
}
//# sourceMappingURL=sessionValidator.js.map