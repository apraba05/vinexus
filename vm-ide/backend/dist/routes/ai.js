"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessionStore_1 = require("../sessionStore");
const aiService_1 = require("../services/aiService");
const validationEngine_1 = require("../services/validationEngine");
const types_1 = require("../types");
const router = (0, express_1.Router)();
/**
 * POST /api/ai/explain
 * Explain a config/code file using AI.
 */
router.post("/explain", async (req, res) => {
    try {
        const { sessionId, filePath, content } = req.body;
        if (!sessionId || !filePath) {
            return res.status(400).json({ error: "sessionId and filePath required" });
        }
        // Use provided content or read from VM
        let fileContent = content;
        if (!fileContent) {
            const session = (0, sessionStore_1.getSession)(sessionId);
            if (!session)
                return res.status(404).json({ error: "Session not found" });
            const buf = await (0, types_1.sftpReadFile)(session.sftp, filePath);
            fileContent = buf.toString("utf-8");
        }
        const explanation = await aiService_1.aiService.explainFile(filePath, fileContent);
        res.json(explanation);
    }
    catch (err) {
        console.error("[ai] explain error:", err.message);
        res.status(500).json({ error: err.message });
    }
});
/**
 * POST /api/ai/diagnose
 * Diagnose a service failure from logs.
 */
router.post("/diagnose", async (req, res) => {
    try {
        const { sessionId, service, logs, configPath } = req.body;
        if (!service || !logs) {
            return res.status(400).json({ error: "service and logs required" });
        }
        let configContent;
        if (configPath && sessionId) {
            try {
                const session = (0, sessionStore_1.getSession)(sessionId);
                if (session) {
                    const buf = await (0, types_1.sftpReadFile)(session.sftp, configPath);
                    configContent = buf.toString("utf-8");
                }
            }
            catch {
                // Config read is optional
            }
        }
        const analysis = await aiService_1.aiService.diagnoseFailure(service, logs, configContent);
        res.json(analysis);
    }
    catch (err) {
        console.error("[ai] diagnose error:", err.message);
        res.status(500).json({ error: err.message });
    }
});
/**
 * POST /api/ai/validate
 * Run file validators and optionally explain errors with AI.
 */
router.post("/validate", async (req, res) => {
    try {
        const { sessionId, filePath, aiExplain } = req.body;
        if (!sessionId || !filePath) {
            return res.status(400).json({ error: "sessionId and filePath required" });
        }
        const session = (0, sessionStore_1.getSession)(sessionId);
        if (!session)
            return res.status(404).json({ error: "Session not found" });
        const report = await validationEngine_1.validationEngine.validateFile(sessionId, filePath);
        // If validation failed and AI explanation requested
        if (!report.overallValid && aiExplain) {
            const errors = report.results
                .filter((r) => !r.result.valid)
                .flatMap((r) => r.result.errors)
                .join("\n");
            try {
                const buf = await (0, types_1.sftpReadFile)(session.sftp, filePath);
                const fileContent = buf.toString("utf-8");
                const aiResult = await aiService_1.aiService.explainValidationError(filePath, errors, fileContent);
                return res.json({ ...report, aiExplanation: aiResult });
            }
            catch {
                // AI explanation is optional
            }
        }
        res.json(report);
    }
    catch (err) {
        console.error("[ai] validate error:", err.message);
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /api/ai/validators
 * List available validators.
 */
router.get("/validators", (_req, res) => {
    res.json({ validators: validationEngine_1.validationEngine.getValidators() });
});
exports.default = router;
//# sourceMappingURL=ai.js.map