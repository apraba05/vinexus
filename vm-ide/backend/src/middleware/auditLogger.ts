import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

interface AuditEntry {
  timestamp: string;
  method: string;
  path: string;
  sessionId?: string;
  ip: string;
  statusCode: number;
  durationMs: number;
  userAgent?: string;
}

// Pluggable audit log interface — file-based for now,
// swap to PostgreSQL by implementing this interface.
export interface AuditStore {
  write(entry: AuditEntry): void;
}

class FileAuditStore implements AuditStore {
  private logDir: string;
  private stream: fs.WriteStream | null = null;
  private currentDate: string = "";

  constructor() {
    this.logDir = process.env.AUDIT_LOG_DIR || path.join(process.cwd(), "logs");
    try {
      fs.mkdirSync(this.logDir, { recursive: true });
    } catch {
      // directory may already exist
    }
  }

  write(entry: AuditEntry): void {
    const today = entry.timestamp.slice(0, 10); // YYYY-MM-DD
    if (today !== this.currentDate) {
      this.stream?.end();
      this.currentDate = today;
      const logFile = path.join(this.logDir, `audit-${today}.jsonl`);
      this.stream = fs.createWriteStream(logFile, { flags: "a" });
    }
    this.stream?.write(JSON.stringify(entry) + "\n");
  }
}

// Singleton store — replace with PostgresAuditStore for production
let auditStore: AuditStore = new FileAuditStore();

export function setAuditStore(store: AuditStore): void {
  auditStore = store;
}

/**
 * Express middleware that logs all API requests to an audit log.
 */
export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  // Skip health checks and static assets
  if (req.path === "/health" || req.path.startsWith("/_next")) {
    return next();
  }

  const start = Date.now();

  // Hook into response finish event
  res.on("finish", () => {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      sessionId:
        (req.query.sessionId as string) ||
        req.body?.sessionId ||
        (req as any).sessionId,
      ip: req.ip || req.socket.remoteAddress || "unknown",
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      userAgent: req.headers["user-agent"],
    };

    auditStore.write(entry);
  });

  next();
}
