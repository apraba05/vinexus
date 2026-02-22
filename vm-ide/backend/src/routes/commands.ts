import { Router, Request, Response } from "express";
import { getSession } from "../sessionStore";
import { commandRunner } from "../services/commandRunner";

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
 * GET /api/commands/templates
 * List all available command templates.
 */
router.get("/templates", (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const templates = commandRunner.getTemplates();
  res.json({ templates });
});

/**
 * POST /api/commands/run
 * Execute a predefined command template.
 */
router.post("/run", async (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const { templateId, params = {} } = req.body;
  if (!templateId) {
    res.status(400).json({ error: "templateId is required" });
    return;
  }

  const template = commandRunner.getTemplate(templateId);
  if (!template) {
    res.status(404).json({ error: `Unknown command template: ${templateId}` });
    return;
  }

  try {
    const result = await commandRunner.runTemplate(session.id, templateId, params);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/commands/custom
 * Execute a custom command (requires confirmed: true).
 */
router.post("/custom", async (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const { command, confirmed, sudo = false, timeout = 30000 } = req.body;
  if (!command) {
    res.status(400).json({ error: "command is required" });
    return;
  }
  if (!confirmed) {
    res.status(400).json({ error: "Custom commands require confirmed: true" });
    return;
  }

  try {
    const result = await commandRunner.runCustom(session.id, command, sudo, timeout);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
