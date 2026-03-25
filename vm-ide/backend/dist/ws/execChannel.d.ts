import { WebSocket } from "ws";
import { Session } from "../sessionStore";
import { WSMessage } from "../types";
/**
 * Handles the 'exec' channel for streaming command execution output
 * over the multiplexed WebSocket.
 */
export declare class ExecChannel {
    private ws;
    private session;
    private sendMessage;
    constructor(ws: WebSocket, session: Session, sendMessage: (msg: WSMessage) => void);
    /**
     * Handle an incoming message on the exec channel.
     */
    handleMessage(msg: WSMessage): Promise<void>;
    private runTemplate;
    private runCustom;
    destroy(): void;
}
//# sourceMappingURL=execChannel.d.ts.map