"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessionStore_1 = require("../sessionStore");
const projectConfig_1 = require("../services/projectConfig");
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
 * GET /api/config
 * Load project configuration (.vmide.json) from the remote VM.
 */
router.get("/", async (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
    const rootPath = req.query.rootPath;
    try {
        const config = await projectConfig_1.projectConfigService.load(session.id, rootPath);
        res.json(config);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * POST /api/config/reload
 * Force reload the project configuration.
 */
router.post("/reload", async (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
    const rootPath = req.body.rootPath;
    projectConfig_1.projectConfigService.invalidate(session.id);
    try {
        const config = await projectConfig_1.projectConfigService.load(session.id, rootPath);
        res.json(config);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=config.js.map