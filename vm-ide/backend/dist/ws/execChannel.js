"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecChannel = void 0;
const sshExecutor_1 = require("../services/sshExecutor");
const commandRunner_1 = require("../services/commandRunner");
const uuid_1 = require("uuid");
/**
 * Handles the 'exec' channel for streaming command execution output
 * over the multiplexed WebSocket.
 */
class ExecChannel {
    ws;
    session;
    sendMessage;
    constructor(ws, session, sendMessage) {
        this.ws = ws;
        this.session = session;
        this.sendMessage = sendMessage;
    }
    /**
     * Handle an incoming message on the exec channel.
     */
    async handleMessage(msg) {
        switch (msg.type) {
            case "run_template":
                await this.runTemplate(msg.payload);
                break;
            case "run_custom":
                await this.runCustom(msg.payload);
                break;
        }
    }
    async runTemplate(payload) {
        const execId = payload.execId || (0, uuid_1.v4)();
        const { templateId, params = {} } = payload;
        const template = commandRunner_1.commandRunner.getTemplate(templateId);
        if (!template) {
            this.sendMessage({
                channel: "exec",
                type: "error",
                payload: { execId, error: `Unknown template: ${templateId}` },
            });
            return;
        }
        this.sendMessage({
            channel: "exec",
            type: "started",
            payload: { execId, templateId, command: template.command },
        });
        try {
            const result = await commandRunner_1.commandRunner.runTemplate(this.session.id, templateId, params);
            this.sendMessage({
                channel: "exec",
                type: "completed",
                payload: {
                    execId,
                    templateId,
                    command: result.command,
                    exitCode: result.exitCode,
                    stdout: result.stdout,
                    stderr: result.stderr,
                    durationMs: result.durationMs,
                },
            });
        }
        catch (err) {
            this.sendMessage({
                channel: "exec",
                type: "error",
                payload: { execId, error: err.message },
            });
        }
    }
    async runCustom(payload) {
        const execId = payload.execId || (0, uuid_1.v4)();
        this.sendMessage({
            channel: "exec",
            type: "started",
            payload: { execId, command: payload.command },
        });
        try {
            const result = await sshExecutor_1.sshExecutor.execStreaming({
                sessionId: this.session.id,
                command: payload.command,
                sudo: payload.sudo,
                timeout: payload.timeout,
            }, (line) => {
                this.sendMessage({
                    channel: "exec",
                    type: "output",
                    payload: { execId, stream: "stdout", line },
                });
            }, (line) => {
                this.sendMessage({
                    channel: "exec",
                    type: "output",
                    payload: { execId, stream: "stderr", line },
                });
            });
            this.sendMessage({
                channel: "exec",
                type: "completed",
                payload: {
                    execId,
                    command: payload.command,
                    exitCode: result.exitCode,
                    stdout: result.stdout,
                    stderr: result.stderr,
                    durationMs: result.durationMs,
                },
            });
        }
        catch (err) {
            this.sendMessage({
                channel: "exec",
                type: "error",
                payload: { execId, error: err.message },
            });
        }
    }
    destroy() {
        // No persistent state to clean up
    }
}
exports.ExecChannel = ExecChannel;
//# sourceMappingURL=execChannel.js.map