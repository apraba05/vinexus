import { Request, Response, NextFunction } from "express";
import { getSession } from "../sessionStore";

/**
 * Middleware that validates the sessionId parameter exists and points to a valid session.
 * Extracts sessionId from query params, body, or route params.
 */
export function sessionValidator(req: Request, res: Response, next: NextFunction): void {
  const sessionId =
    (req.query.sessionId as string) ||
    req.body?.sessionId ||
    req.params?.sessionId;

  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const session = getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found or expired" });
    return;
  }

  // Attach session to request for downstream use
  (req as any).session = session;
  (req as any).sessionId = sessionId;

  next();
}
