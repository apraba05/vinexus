import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60_000);

interface RateLimitOptions {
  windowMs?: number;    // Time window in ms (default: 60s)
  max?: number;         // Max requests per window (default: 100)
  keyFn?: (req: Request) => string; // How to identify the client
}

/**
 * Simple in-memory rate limiter middleware.
 */
export function rateLimiter(options: RateLimitOptions = {}) {
  const {
    windowMs = 60_000,
    max = 100,
    keyFn = (req) => req.ip || req.socket.remoteAddress || "unknown",
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
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
export const aiRateLimiter = rateLimiter({
  windowMs: 60_000,
  max: 100,
  keyFn: (req) => `ai:${req.body?.sessionId || req.ip}`,
});

/**
 * Auth rate limiter — stricter for login/connect to prevent brute-force.
 */
export const authRateLimiter = rateLimiter({
  windowMs: 60_000,
  max: 10,
  keyFn: (req) => `auth:${req.ip || req.socket.remoteAddress || "unknown"}`,
});

/**
 * Standard API rate limiter.
 */
export const apiRateLimiter = rateLimiter({
  windowMs: 60_000,
  max: 200,
});
