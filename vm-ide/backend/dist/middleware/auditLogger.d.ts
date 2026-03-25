import { Request, Response, NextFunction } from "express";
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
export interface AuditStore {
    write(entry: AuditEntry): void;
}
export declare function setAuditStore(store: AuditStore): void;
/**
 * Express middleware that logs all API requests to an audit log.
 */
export declare function auditLogger(req: Request, res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=auditLogger.d.ts.map