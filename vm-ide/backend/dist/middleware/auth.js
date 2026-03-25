"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
// Auto-generate a secret on startup if not provided.
// In production, set JWT_SECRET in environment.
const JWT_SECRET = process.env.JWT_SECRET || crypto_1.default.randomBytes(32).toString("hex");
// Expiry in seconds (default 8 hours)
const JWT_EXPIRY_SECONDS = parseInt(process.env.JWT_EXPIRY_SECONDS || "28800", 10);
/**
 * Generate a JWT token for an authenticated session.
 */
function generateToken(payload) {
    const options = { expiresIn: JWT_EXPIRY_SECONDS };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
}
/**
 * Verify and decode a JWT token.
 */
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
/**
 * Express middleware that validates JWT from Authorization header.
 * Skips auth for health check and session connect endpoints.
 */
function authMiddleware(req, res, next) {
    // Skip auth if disabled
    if (process.env.AUTH_ENABLED !== "true") {
        return next();
    }
    // Public routes that don't need auth
    const publicPaths = ["/health", "/api/session/connect"];
    if (publicPaths.some((p) => req.path === p)) {
        return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Authorization required" });
        return;
    }
    const token = authHeader.slice(7);
    try {
        const payload = verifyToken(token);
        // Attach to request for downstream use
        req.auth = payload;
        next();
    }
    catch (err) {
        if (err.name === "TokenExpiredError") {
            res.status(401).json({ error: "Token expired" });
        }
        else {
            res.status(401).json({ error: "Invalid token" });
        }
    }
}
//# sourceMappingURL=auth.js.map