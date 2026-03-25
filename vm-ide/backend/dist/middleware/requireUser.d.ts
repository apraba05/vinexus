import { Request, Response, NextFunction } from "express";
/**
 * Middleware that validates the user from NextAuth v5 JWE session cookie.
 * NextAuth v5 uses encrypted JWTs (JWE), not signed JWTs.
 * Attaches req.user with the user record if found.
 */
export declare function requireUser(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=requireUser.d.ts.map