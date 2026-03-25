import { WebSocket } from "ws";
import { Session } from "../sessionStore";
import { WSMessage } from "../types";
/**
 * Handles the 'terminal' channel within the multiplexed WebSocket.
 * Opens an SSH shell and bridges I/O between the WS client and the shell.
 */
export declare class TerminalChannel {
    private ws;
    private session;
    private sendMessage;
    private shellChannel;
    private closed;
    constructor(ws: WebSocket, session: Session, sendMessage: (msg: WSMessage) => void);
    /**
     * Initialize the shell channel.
     */
    start(): void;
    /**
     * Handle an incoming message on the terminal channel.
     */
    handleMessage(msg: WSMessage): void;
    /**
     * Clean up resources.
     */
    destroy(): void;
}
//# sourceMappingURL=terminalChannel.d.ts.map