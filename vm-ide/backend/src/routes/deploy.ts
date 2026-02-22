import { Router, Request, Response } from "express";
import { getSession } from "../sessionStore";
import { deploymentEngine } from "../services/deploymentEngine";
import { logStreamer } from "../services/logStreamer";

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
 * POST /api/deploy/start
 * Start a deployment pipeline.
 */
router.post("/start", async (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const { files = [] } = req.body;

  try {
    const deployId = await deploymentEngine.start(session.id, files);
    const status = deploymentEngine.getStatus(deployId);
    res.json(status);
  } catch (err: any) {
    if (err.message.includes("already in progress")) {
      res.status(409).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

/**
 * GET /api/deploy/status
 * Get the current status of a deployment.
 */
router.get("/status", (req: Request, res: Response) => {
  const deployId = req.query.deployId as string;
  if (!deployId) {
    res.status(400).json({ error: "deployId is required" });
    return;
  }

  const status = deploymentEngine.getStatus(deployId);
  if (!status) {
    res.status(404).json({ error: "Deployment not found" });
    return;
  }

  res.json(status);
});

/**
 * POST /api/deploy/cancel
 * Cancel an active deployment.
 */
router.post("/cancel", (req: Request, res: Response) => {
  const { deployId } = req.body;
  if (!deployId) {
    res.status(400).json({ error: "deployId is required" });
    return;
  }

  const cancelled = deploymentEngine.cancel(deployId);
  if (!cancelled) {
    res.status(400).json({ error: "Cannot cancel — deployment is not active" });
    return;
  }

  res.json({ ok: true, deployId });
});

/**
 * POST /api/deploy/rollback
 * Rollback a failed deployment.
 */
router.post("/rollback", async (req: Request, res: Response) => {
  const { deployId } = req.body;
  if (!deployId) {
    res.status(400).json({ error: "deployId is required" });
    return;
  }

  try {
    const success = await deploymentEngine.rollback(deployId);
    if (!success) {
      res.status(400).json({ error: "Rollback failed or not applicable" });
      return;
    }
    res.json({ ok: true, deployId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/deploy/logs
 * Fetch recent logs for a service (used after deploy failure).
 */
router.get("/logs", async (req: Request, res: Response) => {
  const session = requireSession(req, res);
  if (!session) return;

  const service = req.query.service as string;
  const lines = parseInt(req.query.lines as string) || 50;

  if (!service) {
    res.status(400).json({ error: "service is required" });
    return;
  }

  try {
    const entries = await logStreamer.fetchLogs(session.id, service, lines);
    res.json({ service, entries });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
