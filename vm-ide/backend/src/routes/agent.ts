import { Router, Request, Response } from "express";
import { agentOrchestrator } from "../services/agentOrchestrator";
import { AgentContext } from "../types";

const router = Router();

// ─── POST /api/agent/start ───────────────────────────────────────
// Pro-only: Start a new agent session

router.post("/start", async (req: Request, res: Response) => {
    const { sessionId, prompt, context, options } = req.body;

    if (!sessionId || !prompt) {
        res.status(400).json({ error: "sessionId and prompt are required" });
        return;
    }

    if (!context?.workspaceRoot) {
        res.status(400).json({ error: "context.workspaceRoot is required" });
        return;
    }

    try {
        // The actual processing happens via WebSocket — this endpoint just validates
        res.json({
            ok: true,
            message: "Use the WebSocket agent channel to start the session",
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/agent/plan ────────────────────────────────────────
// Free users: Generate plan only (no tool execution)

router.post("/plan", async (req: Request, res: Response) => {
    const { sessionId, prompt, context } = req.body;

    if (!sessionId || !prompt) {
        res.status(400).json({ error: "sessionId and prompt are required" });
        return;
    }

    const agentContext: AgentContext = {
        workspaceRoot: context?.workspaceRoot || "/",
        currentFile: context?.currentFile,
        selection: context?.selection,
        folderPath: context?.folderPath,
    };

    try {
        const plan = await agentOrchestrator.planOnly(sessionId, prompt, agentContext);
        res.json({ plan });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/agent/stop ────────────────────────────────────────

router.post("/stop", async (req: Request, res: Response) => {
    const { agentSessionId } = req.body;

    if (!agentSessionId) {
        res.status(400).json({ error: "agentSessionId is required" });
        return;
    }

    try {
        agentOrchestrator.stopSession(agentSessionId);
        res.json({ ok: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// ─── POST /api/agent/rollback ────────────────────────────────────

router.post("/rollback", async (req: Request, res: Response) => {
    const { agentSessionId } = req.body;

    if (!agentSessionId) {
        res.status(400).json({ error: "agentSessionId is required" });
        return;
    }

    try {
        const result = await agentOrchestrator.rollbackSession(agentSessionId);
        res.json({ ok: true, ...result });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/agent/status ───────────────────────────────────────

router.get("/status", (req: Request, res: Response) => {
    const agentSessionId = req.query.agentSessionId as string;

    if (!agentSessionId) {
        res.status(400).json({ error: "agentSessionId is required" });
        return;
    }

    const session = agentOrchestrator.getSession(agentSessionId);
    if (!session) {
        res.status(404).json({ error: "Agent session not found" });
        return;
    }

    res.json({
        id: session.id,
        state: session.state,
        plan: session.plan,
        steps: session.steps,
        fileChanges: session.fileChanges,
        summary: session.summary,
        error: session.error,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        toolCallCount: session.toolCalls.length,
    });
});

// ─── GET /api/agent/history ───────────────────────────────────────

router.get("/history", (req: Request, res: Response) => {
    const sshSessionId = req.query.sshSessionId as string;

    if (!sshSessionId) {
        res.status(400).json({ error: "sshSessionId is required" });
        return;
    }

    try {
        const history = agentOrchestrator.getSessionHistory(sshSessionId);
        res.json({ history });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── DELETE /api/agent/session ────────────────────────────────────

router.delete("/session", (req: Request, res: Response) => {
    const sshSessionId = req.query.sshSessionId as string;
    const sessionId = req.query.sessionId as string;

    if (!sshSessionId || !sessionId) {
        res.status(400).json({ error: "sshSessionId and sessionId are required" });
        return;
    }

    try {
        agentOrchestrator.deleteSession(sessionId, sshSessionId);
        res.json({ ok: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
