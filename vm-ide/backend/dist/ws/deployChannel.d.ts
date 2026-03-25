import { WebSocket } from "ws";
import { Session } from "../sessionStore";
import { WSMessage } from "../types";
/**
 * Handles the 'deploy' channel for deployment pipeline events.
 */
export declare class DeployChannel {
    private ws;
    private session;
    private sendMessage;
    private activeDeployId;
    constructor(ws: WebSocket, session: Session, sendMessage: (msg: WSMessage) => void);
    handleMessage(msg: WSMessage): Promise<void>;
    private startDeploy;
    private getStatus;
    private cancelDeploy;
    private rollbackDeploy;
    destroy(): void;
}
//# sourceMappingURL=deployChannel.d.ts.map