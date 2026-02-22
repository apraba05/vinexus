import { Router, Request, Response } from "express";
import { getSession } from "../sessionStore";
import { projectConfigService } from "../services/projectConfig";

const router = Router();

function requireSession(req: Request, res: Response): ReturnType<typeof getSession> | null {
  const sessionId = (req.query.sessionId || req.body.sessionId) as string;
  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return null;
  }
  const session = getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found or expired" });
    return null;
  }
  return session;
}

/**
 * GET /api/config
 * Load project configuration (.vmide.json) from the remote VM.
 */
router.get("/", async (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const rootPath = req.query.rootPath as string | undefined;

  try {
    const config = await projectConfigService.load(session.id, rootPath);
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/config/reload
 * Force reload the project configuration.
 */
router.post("/reload", async (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const rootPath = req.body.rootPath as string | undefined;

  projectConfigService.invalidate(session.id);

  try {
    const config = await projectConfigService.load(session.id, rootPath);
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
