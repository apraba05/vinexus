"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRateLimiter = exports.authRateLimiter = exports.aiRateLimiter = void 0;
exports.rateLimiter = rateLimiter;
const store = new Map();
// Cleanup stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (now > entry.resetAt) {
            store.delete(key);
        }
    }
}, 5 * 60_000);
/**
 * Simple in-memory rate limiter middleware.
 */
function rateLimiter(options = {}) {
    const { windowMs = 60_000, max = 100, keyFn = (req) => req.ip || req.socket.remoteAddress || "unknown", } = options;
    return (req, res, next) => {
        const key = keyFn(req);
        const now = Date.now();
        let entry = store.get(key);
        if (!entry || now > entry.resetAt) {
            entry = { count: 0, resetAt: now + windowMs };
            store.set(key, entry);
        }
        entry.count++;
        // Set rate limit headers
        res.setHeader("X-RateLimit-Limit", String(max));
        res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
        res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
        if (entry.count > max) {
            res.status(429).json({
                error: "Too many requests, please try again later",
                retryAfter: Math.ceil((entry.resetAt - now) / 1000),
            });
            return;
        }
        next();
    };
}
/**
 * Stricter rate limiter for AI endpoints (more expensive).
 */
exports.aiRateLimiter = rateLimiter({
    windowMs: 60_000,
    max: 100,
    keyFn: (req) => `ai:${req.body?.sessionId || req.ip}`,
});
/**
 * Auth rate limiter — stricter for login/connect to prevent brute-force.
 */
exports.authRateLimiter = rateLimiter({
    windowMs: 60_000,
    max: 10,
    keyFn: (req) => `auth:${req.ip || req.socket.remoteAddress || "unknown"}`,
});
/**
 * Standard API rate limiter.
 */
exports.apiRateLimiter = rateLimiter({
    windowMs: 60_000,
    max: 200,
});
//# sourceMappingURL=rateLimiter.js.map