"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuditStore = setAuditStore;
exports.auditLogger = auditLogger;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class FileAuditStore {
    logDir;
    stream = null;
    currentDate = "";
    constructor() {
        this.logDir = process.env.AUDIT_LOG_DIR || path_1.default.join(process.cwd(), "logs");
        try {
            fs_1.default.mkdirSync(this.logDir, { recursive: true });
        }
        catch {
            // directory may already exist
        }
    }
    write(entry) {
        const today = entry.timestamp.slice(0, 10); // YYYY-MM-DD
        if (today !== this.currentDate) {
            this.stream?.end();
            this.currentDate = today;
            const logFile = path_1.default.join(this.logDir, `audit-${today}.jsonl`);
            this.stream = fs_1.default.createWriteStream(logFile, { flags: "a" });
        }
        this.stream?.write(JSON.stringify(entry) + "\n");
    }
}
// Singleton store — replace with PostgresAuditStore for production
let auditStore = new FileAuditStore();
function setAuditStore(store) {
    auditStore = store;
}
/**
 * Express middleware that logs all API requests to an audit log.
 */
function auditLogger(req, res, next) {
    // Skip health checks and static assets
    if (req.path === "/health" || req.path.startsWith("/_next")) {
        return next();
    }
    const start = Date.now();
    // Hook into response finish event
    res.on("finish", () => {
        const entry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            sessionId: req.query.sessionId ||
                req.body?.sessionId ||
                req.sessionId,
            ip: req.ip || req.socket.remoteAddress || "unknown",
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
            userAgent: req.headers["user-agent"],
        };
        auditStore.write(entry);
    });
    next();
}
//# sourceMappingURL=auditLogger.js.map