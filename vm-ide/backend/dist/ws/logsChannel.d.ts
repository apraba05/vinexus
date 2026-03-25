import { WebSocket } from "ws";
import { Session } from "../sessionStore";
import { WSMessage } from "../types";
/**
 * Handles the 'logs' channel for real-time log streaming.
 */
export declare class LogsChannel {
    private ws;
    private session;
    private sendMessage;
    private streamHandle;
    constructor(ws: WebSocket, session: Session, sendMessage: (msg: WSMessage) => void);
    handleMessage(msg: WSMessage): Promise<void>;
    private subscribe;
    private unsubscribe;
    private fetch;
    destroy(): void;
}
//# sourceMappingURL=logsChannel.d.ts.map