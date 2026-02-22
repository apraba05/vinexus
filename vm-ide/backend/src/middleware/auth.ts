import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Auto-generate a secret on startup if not provided.
// In production, set JWT_SECRET in environment.
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
// Expiry in seconds (default 8 hours)
const JWT_EXPIRY_SECONDS = parseInt(process.env.JWT_EXPIRY_SECONDS || "28800", 10);

export interface JWTPayload {
  sessionId: string;
  host: string;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for an authenticated session.
 */
export function generateToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  const options: jwt.SignOptions = { expiresIn: JWT_EXPIRY_SECONDS };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify and decode a JWT token.
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

/**
 * Express middleware that validates JWT from Authorization header.
 * Skips auth for health check and session connect endpoints.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
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
    (req as any).auth = payload;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      res.status(401).json({ error: "Token expired" });
    } else {
      res.status(401).json({ error: "Invalid token" });
    }
  }
}
