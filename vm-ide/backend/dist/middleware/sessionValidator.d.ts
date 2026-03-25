import { Request, Response, NextFunction } from "express";
/**
 * Middleware that validates the sessionId parameter exists and points to a valid session.
 * Extracts sessionId from query params, body, or route params.
 */
export declare function sessionValidator(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=sessionValidator.d.ts.map