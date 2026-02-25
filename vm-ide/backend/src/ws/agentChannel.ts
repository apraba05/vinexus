import { WebSocket } from "ws";
import { Session } from "../sessionStore";
import { WSMessage, AgentContext, AgentOptions } from "../types";
import { agentOrchestrator } from "../services/agentOrchestrator";

/**
 * Handles the 'agent' channel for AI Developer Mode.
 * Streams agent events (plan, edits, commands, errors) back to the frontend.
 */
export class AgentChannel {
    private activeSessionId: string | null = null;

    constructor(
        private ws: WebSocket,
        private session: Session,
        private sendMessage: (msg: WSMessage) => void
    ) { }

    async handleMessage(msg: WSMessage): Promise<void> {
        switch (msg.type) {
            case "start":
                await this.handleStart(msg.payload);
                break;
            case "pause":
                this.handlePause();
                break;
            case "resume":
                this.handleResume();
                break;
            case "stop":
                this.handleStop();
                break;
            case "rollback":
                await this.handleRollback();
                break;
            case "plan_only":
                await this.handlePlanOnly(msg.payload);
                break;
            case "grant_permission":
                this.handleGrantPermission();
                break;
            case "deny_permission":
                this.handleDenyPermission();
                break;
            case "reset":
                this.handleReset();
                break;
            default:
                this.sendMessage({
                    channel: "agent",
                    type: "error",
                    payload: { error: `Unknown agent message type: ${msg.type}` },
                });
        }
    }

    private async handleStart(payload: {
        prompt: string;
        context: AgentContext;
        options?: Partial<AgentOptions>;
    }): Promise<void> {
        const emit = (type: string, data: any) => {
            this.sendMessage({
                channel: "agent",
                type,
                payload: { ...data, timestamp: Date.now() },
            });
        };

        if (this.activeSessionId) {
            const session = agentOrchestrator.getSession(this.activeSessionId);
            if (session && ["done", "failed", "stopped"].includes(session.state)) {
                try {
                    await agentOrchestrator.continueSession(
                        this.activeSessionId,
                        payload.prompt,
                        payload.context,
                        emit
                    );
                } catch (err: any) {
                    this.sendMessage({
                        channel: "agent",
                        type: "error",
                        payload: { error: err.message },
                    });
                }
                return;
            }

            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: "An agent session is already active. Stop it first." },
            });
            return;
        }

        try {

            const session = await agentOrchestrator.startSession(
                this.session.id,
                payload.prompt,
                payload.context,
                payload.options || {},
                emit,
            );

            this.activeSessionId = session.id;
        } catch (err: any) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }

    private handlePause(): void {
        if (!this.activeSessionId) return;
        try {
            agentOrchestrator.pauseSession(this.activeSessionId);
            this.sendMessage({
                channel: "agent",
                type: "state_change",
                payload: { state: "paused" },
            });
        } catch (err: any) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }

    private handleResume(): void {
        if (!this.activeSessionId) return;
        try {
            agentOrchestrator.resumeSession(this.activeSessionId);
            this.sendMessage({
                channel: "agent",
                type: "state_change",
                payload: { state: "running" },
            });
        } catch (err: any) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }

    private handleStop(): void {
        if (!this.activeSessionId) return;
        try {
            agentOrchestrator.stopSession(this.activeSessionId);
            this.activeSessionId = null;
            this.sendMessage({
                channel: "agent",
                type: "state_change",
                payload: { state: "stopped" },
            });
        } catch (err: any) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }

    private handleGrantPermission(): void {
        if (!this.activeSessionId) return;
        try {
            agentOrchestrator.grantPermission(this.activeSessionId);
        } catch (err: any) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }

    private handleDenyPermission(): void {
        if (!this.activeSessionId) return;
        try {
            agentOrchestrator.denyPermission(this.activeSessionId);
        } catch (err: any) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }

    private async handleRollback(): Promise<void> {
        if (!this.activeSessionId) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: "No active agent session to rollback" },
            });
            return;
        }

        try {
            this.sendMessage({
                channel: "agent",
                type: "state_change",
                payload: { state: "rolling_back" },
            });

            const result = await agentOrchestrator.rollbackSession(this.activeSessionId);
            this.activeSessionId = null;

            this.sendMessage({
                channel: "agent",
                type: "rollback_complete",
                payload: { restoredFiles: result.restoredFiles },
            });
        } catch (err: any) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }

    private async handlePlanOnly(payload: {
        prompt: string;
        context: AgentContext;
    }): Promise<void> {
        try {
            this.sendMessage({
                channel: "agent",
                type: "state_change",
                payload: { state: "planning" },
            });

            const plan = await agentOrchestrator.planOnly(
                this.session.id,
                payload.prompt,
                payload.context
            );

            this.sendMessage({
                channel: "agent",
                type: "plan",
                payload: { plan },
            });

            this.sendMessage({
                channel: "agent",
                type: "state_change",
                payload: { state: "done" },
            });
        } catch (err: any) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }

    private handleReset(): void {
        this.activeSessionId = null;
    }

    destroy(): void {
        if (this.activeSessionId) {
            try {
                agentOrchestrator.stopSession(this.activeSessionId);
            } catch {
                // Session may already be stopped
            }
            this.activeSessionId = null;
        }
    }
}
