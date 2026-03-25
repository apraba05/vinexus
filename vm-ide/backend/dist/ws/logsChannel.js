"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsChannel = void 0;
const logStreamer_1 = require("../services/logStreamer");
/**
 * Handles the 'logs' channel for real-time log streaming.
 */
class LogsChannel {
    ws;
    session;
    sendMessage;
    streamHandle = null;
    constructor(ws, session, sendMessage) {
        this.ws = ws;
        this.session = session;
        this.sendMessage = sendMessage;
    }
    async handleMessage(msg) {
        switch (msg.type) {
            case "subscribe":
                await this.subscribe(msg.payload);
                break;
            case "unsubscribe":
                this.unsubscribe();
                break;
            case "fetch":
                await this.fetch(msg.payload);
                break;
        }
    }
    async subscribe(payload) {
        // Stop any existing stream
        this.unsubscribe();
        const { service } = payload;
        if (!service) {
            this.sendMessage({
                channel: "logs",
                type: "error",
                payload: { message: "service is required" },
            });
            return;
        }
        try {
            this.streamHandle = await logStreamer_1.logStreamer.startStreaming(this.session.id, service, (entry) => {
                this.sendMessage({
                    channel: "logs",
                    type: "entry",
                    payload: entry,
                });
            }, (error) => {
                this.sendMessage({
                    channel: "logs",
                    type: "error",
                    payload: { message: error },
                });
            });
            this.sendMessage({
                channel: "logs",
                type: "subscribed",
                payload: { service },
            });
        }
        catch (err) {
            this.sendMessage({
                channel: "logs",
                type: "error",
                payload: { message: err.message },
            });
        }
    }
    unsubscribe() {
        if (this.streamHandle) {
            this.streamHandle.stop();
            this.streamHandle = null;
        }
    }
    async fetch(payload) {
        const { service, lines = 50 } = payload;
        try {
            const entries = await logStreamer_1.logStreamer.fetchLogs(this.session.id, service, lines);
            this.sendMessage({
                channel: "logs",
                type: "batch",
                payload: { service, entries },
            });
        }
        catch (err) {
            this.sendMessage({
                channel: "logs",
                type: "error",
                payload: { message: err.message },
            });
        }
    }
    destroy() {
        this.unsubscribe();
    }
}
exports.LogsChannel = LogsChannel;
//# sourceMappingURL=logsChannel.js.map