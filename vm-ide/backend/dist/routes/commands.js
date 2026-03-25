"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessionStore_1 = require("../sessionStore");
const commandRunner_1 = require("../services/commandRunner");
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
 * GET /api/commands/templates
 * List all available command templates.
 */
router.get("/templates", (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
    const templates = commandRunner_1.commandRunner.getTemplates();
    res.json({ templates });
});
/**
 * POST /api/commands/run
 * Execute a predefined command template.
 */
router.post("/run", async (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
    const { templateId, params = {} } = req.body;
    if (!templateId) {
        res.status(400).json({ error: "templateId is required" });
        return;
    }
    const template = commandRunner_1.commandRunner.getTemplate(templateId);
    if (!template) {
        res.status(404).json({ error: `Unknown command template: ${templateId}` });
        return;
    }
    try {
        const result = await commandRunner_1.commandRunner.runTemplate(session.id, templateId, params);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * POST /api/commands/custom
 * Execute a custom command (requires confirmed: true).
 */
router.post("/custom", async (req, res) => {
    const session = requireSession(req, res);
    if (!session)
        return;
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
        const result = await commandRunner_1.commandRunner.runCustom(session.id, command, sudo, timeout);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=commands.js.map