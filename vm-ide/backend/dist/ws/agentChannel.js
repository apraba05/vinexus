"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentChannel = void 0;
const agentOrchestrator_1 = require("../services/agentOrchestrator");
/**
 * Handles the 'agent' channel for AI Developer Mode.
 * Streams agent events (plan, edits, commands, errors) back to the frontend.
 */
class AgentChannel {
    ws;
    session;
    sendMessage;
    activeSessionId = null;
    constructor(ws, session, sendMessage) {
        this.ws = ws;
        this.session = session;
        this.sendMessage = sendMessage;
    }
    async handleMessage(msg) {
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
    async handleStart(payload) {
        const emit = (type, data) => {
            this.sendMessage({
                channel: "agent",
                type,
                payload: { ...data, timestamp: Date.now() },
            });
        };
        if (this.activeSessionId) {
            const session = agentOrchestrator_1.agentOrchestrator.getSession(this.activeSessionId);
            if (session && ["done", "failed", "stopped"].includes(session.state)) {
                try {
                    await agentOrchestrator_1.agentOrchestrator.continueSession(this.activeSessionId, payload.prompt, payload.context, emit);
                }
                catch (err) {
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
            const session = await agentOrchestrator_1.agentOrchestrator.startSession(this.session.id, payload.prompt, payload.context, payload.options || {}, emit);
            this.activeSessionId = session.id;
        }
        catch (err) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }
    handlePause() {
        if (!this.activeSessionId)
            return;
        try {
            agentOrchestrator_1.agentOrchestrator.pauseSession(this.activeSessionId);
            this.sendMessage({
                channel: "agent",
                type: "state_change",
                payload: { state: "paused" },
            });
        }
        catch (err) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }
    handleResume() {
        if (!this.activeSessionId)
            return;
        try {
            agentOrchestrator_1.agentOrchestrator.resumeSession(this.activeSessionId);
            this.sendMessage({
                channel: "agent",
                type: "state_change",
                payload: { state: "running" },
            });
        }
        catch (err) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }
    handleStop() {
        if (!this.activeSessionId)
            return;
        try {
            agentOrchestrator_1.agentOrchestrator.stopSession(this.activeSessionId);
            this.activeSessionId = null;
            this.sendMessage({
                channel: "agent",
                type: "state_change",
                payload: { state: "stopped" },
            });
        }
        catch (err) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }
    handleGrantPermission() {
        if (!this.activeSessionId)
            return;
        try {
            agentOrchestrator_1.agentOrchestrator.grantPermission(this.activeSessionId);
        }
        catch (err) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }
    handleDenyPermission() {
        if (!this.activeSessionId)
            return;
        try {
            agentOrchestrator_1.agentOrchestrator.denyPermission(this.activeSessionId);
        }
        catch (err) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }
    async handleRollback() {
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
            const result = await agentOrchestrator_1.agentOrchestrator.rollbackSession(this.activeSessionId);
            this.activeSessionId = null;
            this.sendMessage({
                channel: "agent",
                type: "rollback_complete",
                payload: { restoredFiles: result.restoredFiles },
            });
        }
        catch (err) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }
    async handlePlanOnly(payload) {
        try {
            this.sendMessage({
                channel: "agent",
                type: "state_change",
                payload: { state: "planning" },
            });
            const plan = await agentOrchestrator_1.agentOrchestrator.planOnly(this.session.id, payload.prompt, payload.context);
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
        }
        catch (err) {
            this.sendMessage({
                channel: "agent",
                type: "error",
                payload: { error: err.message },
            });
        }
    }
    handleReset() {
        this.activeSessionId = null;
    }
    destroy() {
        if (this.activeSessionId) {
            try {
                agentOrchestrator_1.agentOrchestrator.stopSession(this.activeSessionId);
            }
            catch {
                // Session may already be stopped
            }
            this.activeSessionId = null;
        }
    }
}
exports.AgentChannel = AgentChannel;
//# sourceMappingURL=agentChannel.js.map