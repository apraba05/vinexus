import { Request, Response, NextFunction } from "express";
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
export declare function generateToken(payload: Omit<JWTPayload, "iat" | "exp">): string;
/**
 * Verify and decode a JWT token.
 */
export declare function verifyToken(token: string): JWTPayload;
/**
 * Express middleware that validates JWT from Authorization header.
 * Skips auth for health check and session connect endpoints.
 */
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map