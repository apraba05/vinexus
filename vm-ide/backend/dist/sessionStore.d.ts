import { Client, SFTPWrapper } from "ssh2";
export interface Session {
    id: string;
    conn: Client;
    sftp: SFTPWrapper;
    host: string;
    username: string;
    lastActivity: number;
}
export declare function getSession(sessionId: string): Session | undefined;
export declare function createSession(conn: Client, sftp: SFTPWrapper, host: string, username: string): string;
export declare function destroySession(sessionId: string): boolean;
export declare function startCleanupInterval(): NodeJS.Timeout;
//# sourceMappingURL=sessionStore.d.ts.map