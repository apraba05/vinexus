"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessionStore_1 = require("../sessionStore");
const deploymentEngine_1 = require("../services/deploymentEngine");
const logStreamer_1 = require("../services/logStreamer");
const router = (0, express_1.Router)();
function requireSession(req, res) {
    const sessionId = (req.query.sessionId || req.body.sessionId);
    if (!sessionId) {
        res.status(400).json({ error: "sessionId is required" });
        return null;
    }
    const session = (0, sessionStore_1.getSession)(sessionId);
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
router.post("/start", async (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
    const { files = [] } = req.body;
    try {
        const deployId = await deploymentEngine_1.deploymentEngine.start(session.id, files);
        const status = deploymentEngine_1.deploymentEngine.getStatus(deployId);
        res.json(status);
    }
    catch (err) {
        if (err.message.includes("already in progress")) {
            res.status(409).json({ error: err.message });
        }
        else {
            res.status(500).json({ error: err.message });
        }
    }
});
/**
 * GET /api/deploy/status
 * Get the current status of a deployment.
 */
router.get("/status", (req, res) => {
    const deployId = req.query.deployId;
    if (!deployId) {
        res.status(400).json({ error: "deployId is required" });
        return;
    }
    const status = deploymentEngine_1.deploymentEngine.getStatus(deployId);
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
router.post("/cancel", (req, res) => {
    const { deployId } = req.body;
    if (!deployId) {
        res.status(400).json({ error: "deployId is required" });
        return;
    }
    const cancelled = deploymentEngine_1.deploymentEngine.cancel(deployId);
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
router.post("/rollback", async (req, res) => {
    const { deployId } = req.body;
    if (!deployId) {
        res.status(400).json({ error: "deployId is required" });
        return;
    }
    try {
        const success = await deploymentEngine_1.deploymentEngine.rollback(deployId);
        if (!success) {
            res.status(400).json({ error: "Rollback failed or not applicable" });
            return;
        }
        res.json({ ok: true, deployId });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /api/deploy/logs
 * Fetch recent logs for a service (used after deploy failure).
 */
router.get("/logs", async (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
    const service = req.query.service;
    const lines = parseInt(req.query.lines) || 50;
    if (!service) {
        res.status(400).json({ error: "service is required" });
        return;
    }
    try {
        const entries = await logStreamer_1.logStreamer.fetchLogs(session.id, service, lines);
        res.json({ service, entries });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=deploy.js.map