"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSession = getSession;
exports.createSession = createSession;
exports.destroySession = destroySession;
exports.startCleanupInterval = startCleanupInterval;
const uuid_1 = require("uuid");
const sessions = new Map();
const SESSION_TIMEOUT_MS = (parseInt(process.env.SESSION_TIMEOUT_MINUTES || "30", 10)) * 60 * 1000;
function getSession(sessionId) {
    const session = sessions.get(sessionId);
    if (session) {
        session.lastActivity = Date.now();
    }
    return session;
}
function createSession(conn, sftp, host, username) {
    const id = (0, uuid_1.v4)();
    sessions.set(id, { id, conn, sftp, host, username, lastActivity: Date.now() });
    return id;
}
function destroySession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session)
        return false;
    try {
        session.conn.end();
    }
    catch {
        // already closed
    }
    sessions.delete(sessionId);
    return true;
}
function startCleanupInterval() {
    return setInterval(() => {
        const now = Date.now();
        for (const [id, session] of sessions) {
            if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
                console.log(`[cleanup] Expiring idle session ${id}`);
                destroySession(id);
            }
        }
    }, 60_000);
}
//# sourceMappingURL=sessionStore.js.map