import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import sessionRouter from "./routes/session";
import fsRouter from "./routes/fs";
import commandsRouter from "./routes/commands";
import deployRouter from "./routes/deploy";
import configRouter from "./routes/config";
import aiRouter from "./routes/ai";
import agentRouter from "./routes/agent";
import { setupWebSockets } from "./ws/multiplexer";
import { startCleanupInterval } from "./sessionStore";
import { authMiddleware } from "./middleware/auth";
import { apiRateLimiter, aiRateLimiter, authRateLimiter } from "./middleware/rateLimiter";
import { auditLogger } from "./middleware/auditLogger";
import { requireUser } from "./middleware/requireUser";
import { requirePro } from "./middleware/requirePro";

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

// ─── Global middleware ──────────────────────────────────────────
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: false, // CSP handled by Caddy in production
  crossOriginEmbedderPolicy: false, // Required for Monaco editor
}));
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: "3mb" }));
app.use(auditLogger);
app.use(authMiddleware);
app.use(apiRateLimiter);

// ─── Routes ─────────────────────────────────────────────────────
app.use("/api/session", authRateLimiter, sessionRouter);
app.use("/api/fs", fsRouter);
app.use("/api/commands", requireUser, requirePro, commandsRouter);
app.use("/api/deploy", deployRouter);
app.use("/api/config", configRouter);
app.use("/api/ai", aiRateLimiter, requireUser, requirePro, aiRouter);
app.use("/api/agent", aiRateLimiter, requireUser, agentRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", auth: process.env.AUTH_ENABLED === "true" });
});

// ─── Error handler ──────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[server] Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

const server = http.createServer(app);

setupWebSockets(server);
startCleanupInterval();

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
