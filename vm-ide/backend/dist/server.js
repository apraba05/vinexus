"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = __importDefault(require("http"));
const session_1 = __importDefault(require("./routes/session"));
const fs_1 = __importDefault(require("./routes/fs"));
const commands_1 = __importDefault(require("./routes/commands"));
const deploy_1 = __importDefault(require("./routes/deploy"));
const config_1 = __importDefault(require("./routes/config"));
const ai_1 = __importDefault(require("./routes/ai"));
const agent_1 = __importDefault(require("./routes/agent"));
const multiplexer_1 = require("./ws/multiplexer");
const sessionStore_1 = require("./sessionStore");
const auth_1 = require("./middleware/auth");
const rateLimiter_1 = require("./middleware/rateLimiter");
const auditLogger_1 = require("./middleware/auditLogger");
const requireUser_1 = require("./middleware/requireUser");
const requirePro_1 = require("./middleware/requirePro");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "4000", 10);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
// ─── Global middleware ──────────────────────────────────────────
app.disable("x-powered-by");
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // CSP handled by Caddy in production
    crossOriginEmbedderPolicy: false, // Required for Monaco editor
}));
app.use((0, cors_1.default)({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express_1.default.json({ limit: "3mb" }));
app.use(auditLogger_1.auditLogger);
app.use(auth_1.authMiddleware);
app.use(rateLimiter_1.apiRateLimiter);
// ─── Routes ─────────────────────────────────────────────────────
app.use("/api/session", rateLimiter_1.authRateLimiter, session_1.default);
app.use("/api/fs", fs_1.default);
app.use("/api/commands", requireUser_1.requireUser, requirePro_1.requirePro, commands_1.default);
app.use("/api/deploy", deploy_1.default);
app.use("/api/config", config_1.default);
app.use("/api/ai", rateLimiter_1.aiRateLimiter, requireUser_1.requireUser, requirePro_1.requirePro, ai_1.default);
app.use("/api/agent", rateLimiter_1.aiRateLimiter, requireUser_1.requireUser, agent_1.default);
app.get("/health", (_req, res) => {
    res.json({ status: "ok", auth: process.env.AUTH_ENABLED === "true" });
});
// ─── Error handler ──────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error("[server] Unhandled error:", err.message);
    res.status(500).json({ error: "Internal server error" });
});
const server = http_1.default.createServer(app);
(0, multiplexer_1.setupWebSockets)(server);
(0, sessionStore_1.startCleanupInterval)();
server.listen(PORT, () => {
    const authStatus = process.env.AUTH_ENABLED === "true" ? "ON" : "OFF";
    console.log(`
╔══════════════════════════════════════════════╗
║  VM-IDE Backend v1.0                         ║
║  Port: ${String(PORT).padEnd(37)}║
║  Auth: ${authStatus.padEnd(37)}║
║  Audit: logs/audit-YYYY-MM-DD.jsonl          ║
╚══════════════════════════════════════════════╝
  `);
});
//# sourceMappingURL=server.js.map