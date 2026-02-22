import { Client, SFTPWrapper } from "ssh2";
import { v4 as uuidv4 } from "uuid";

export interface Session {
  id: string;
  conn: Client;
  sftp: SFTPWrapper;
  host: string;
  username: string;
  lastActivity: number;
}

const sessions = new Map<string, Session>();

const SESSION_TIMEOUT_MS =
  (parseInt(process.env.SESSION_TIMEOUT_MINUTES || "30", 10)) * 60 * 1000;

export function getSession(sessionId: string): Session | undefined {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = Date.now();
  }
  return session;
}

export function createSession(
  conn: Client,
  sftp: SFTPWrapper,
  host: string,
  username: string
): string {
  const id = uuidv4();
  sessions.set(id, { id, conn, sftp, host, username, lastActivity: Date.now() });
  return id;
}

export function destroySession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  try {
    session.conn.end();
  } catch {
    // already closed
  }
  sessions.delete(sessionId);
  return true;
}

export function startCleanupInterval(): NodeJS.Timeout {
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
