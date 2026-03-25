import { WebSocket } from "ws";
import { Session } from "../sessionStore";
import { WSMessage } from "../types";
/**
 * Handles the 'agent' channel for AI Developer Mode.
 * Streams agent events (plan, edits, commands, errors) back to the frontend.
 */
export declare class AgentChannel {
    private ws;
    private session;
    private sendMessage;
    private activeSessionId;
    constructor(ws: WebSocket, session: Session, sendMessage: (msg: WSMessage) => void);
    handleMessage(msg: WSMessage): Promise<void>;
    private handleStart;
    private handlePause;
    private handleResume;
    private handleStop;
    private handleGrantPermission;
    private handleDenyPermission;
    private handleRollback;
    private handlePlanOnly;
    private handleReset;
    destroy(): void;
}
//# sourceMappingURL=agentChannel.d.ts.map