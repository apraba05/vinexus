import { Request, Response, NextFunction } from "express";
interface RateLimitOptions {
    windowMs?: number;
    max?: number;
    keyFn?: (req: Request) => string;
}
/**
 * Simple in-memory rate limiter middleware.
 */
export declare function rateLimiter(options?: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Stricter rate limiter for AI endpoints (more expensive).
 */
export declare const aiRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Auth rate limiter — stricter for login/connect to prevent brute-force.
 */
export declare const authRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Standard API rate limiter.
 */
export declare const apiRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=rateLimiter.d.ts.map