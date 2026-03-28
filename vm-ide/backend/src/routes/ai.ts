import { Router, Request, Response } from "express";
import { getSession } from "../sessionStore";
import { aiService } from "../services/aiService";
import { validationEngine } from "../services/validationEngine";
import { sftpReadFile } from "../types";
import {
  getMonthlyTokenUsage,
  getDailyRequestUsage,
  PLAN_TOKEN_LIMITS,
  PLAN_DAILY_REQUEST_LIMITS,
} from "../services/tokenQuota";

const router = Router();

/**
 * POST /api/ai/explain
 * Explain a config/code file using AI.
 */
router.post("/explain", async (req: Request, res: Response) => {
  try {
    const { sessionId, filePath, content } = req.body;
    if (!sessionId || !filePath) {
      return res.status(400).json({ error: "sessionId and filePath required" });
    }

    const user = (req as any).user;

    // Use provided content or read from VM
    let fileContent = content;
    if (!fileContent) {
      const session = getSession(sessionId);
      if (!session) return res.status(404).json({ error: "Session not found" });
      const buf = await sftpReadFile(session.sftp, filePath);
      fileContent = buf.toString("utf-8");
    }

    const explanation = await aiService.explainFile(filePath, fileContent, user.id, user.plan);
    res.json(explanation);
  } catch (err: any) {
    console.error("[ai] explain error:", err.message);
    const status = err.message?.includes("limit") ? 429 : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/ai/diagnose
 * Diagnose a service failure from logs.
 */
router.post("/diagnose", async (req: Request, res: Response) => {
  try {
    const { sessionId, service, logs, configPath } = req.body;
    if (!service || !logs) {
      return res.status(400).json({ error: "service and logs required" });
    }

    const user = (req as any).user;

    let configContent: string | undefined;
    if (configPath && sessionId) {
      try {
        const session = getSession(sessionId);
        if (session) {
          const buf = await sftpReadFile(session.sftp, configPath);
          configContent = buf.toString("utf-8");
        }
      } catch {
        // Config read is optional
      }
    }

    const analysis = await aiService.diagnoseFailure(service, logs, configContent, user.id, user.plan);
    res.json(analysis);
  } catch (err: any) {
    console.error("[ai] diagnose error:", err.message);
    const status = err.message?.includes("limit") ? 429 : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/ai/validate
 * Run file validators and optionally explain errors with AI.
 */
router.post("/validate", async (req: Request, res: Response) => {
  try {
    const { sessionId, filePath, aiExplain } = req.body;
    if (!sessionId || !filePath) {
      return res.status(400).json({ error: "sessionId and filePath required" });
    }

    const user = (req as any).user;
    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const report = await validationEngine.validateFile(sessionId, filePath);

    // If validation failed and AI explanation requested
    if (!report.overallValid && aiExplain) {
      const errors = report.results
        .filter((r) => !r.result.valid)
        .flatMap((r) => r.result.errors)
        .join("\n");

      try {
        const buf = await sftpReadFile(session.sftp, filePath);
        const fileContent = buf.toString("utf-8");
        const aiResult = await aiService.explainValidationError(
          filePath,
          errors,
          fileContent,
          user.id,
          user.plan
        );
        return res.json({ ...report, aiExplanation: aiResult });
      } catch {
        // AI explanation is optional — quota errors silently fall through
      }
    }

    res.json(report);
  } catch (err: any) {
    console.error("[ai] validate error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ai/validators
 * List available validators.
 */
router.get("/validators", (_req: Request, res: Response) => {
  res.json({ validators: validationEngine.getValidators() });
});

/**
 * GET /api/ai/usage
 * Return current user's token usage and daily request count.
 */
router.get("/usage", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const plan = (user.plan ?? "free").toLowerCase();

    const [tokensUsed, dailyRequests] = await Promise.all([
      getMonthlyTokenUsage(user.id),
      getDailyRequestUsage(user.id),
    ]);

    const tokenLimit = PLAN_TOKEN_LIMITS[plan] ?? 0;
    const dailyLimit = PLAN_DAILY_REQUEST_LIMITS[plan] ?? -1;

    // First day of next month as reset date
    const now = new Date();
    const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      .toISOString()
      .split("T")[0];

    res.json({ tokensUsed, tokenLimit, dailyRequests, dailyLimit, resetAt });
  } catch (err: any) {
    console.error("[ai] usage error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
