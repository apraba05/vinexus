import { Request, Response, NextFunction } from "express";
/**
 * Middleware that checks if the authenticated user has an active paid subscription.
 * Must be used AFTER requireUser middleware.
 * Returns 402 Payment Required if the user is on the Free plan.
 */
export declare function requirePro(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=requirePro.d.ts.map