"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalChannel = void 0;
const ws_1 = require("ws");
/**
 * Handles the 'terminal' channel within the multiplexed WebSocket.
 * Opens an SSH shell and bridges I/O between the WS client and the shell.
 */
class TerminalChannel {
    ws;
    session;
    sendMessage;
    shellChannel = null;
    closed = false;
    constructor(ws, session, sendMessage) {
        this.ws = ws;
        this.session = session;
        this.sendMessage = sendMessage;
    }
    /**
     * Initialize the shell channel.
     */
    start() {
        this.session.conn.shell({ term: "xterm-256color", cols: 80, rows: 24 }, (err, channel) => {
            if (err) {
                this.sendMessage({
                    channel: "terminal",
                    type: "error",
                    payload: { message: "Failed to open shell: " + err.message },
                });
                return;
            }
            this.shellChannel = channel;
            channel.on("data", (data) => {
                if (this.ws.readyState === ws_1.WebSocket.OPEN) {
                    this.sendMessage({
                        channel: "terminal",
                        type: "data",
                        payload: data.toString("base64"),
                    });
                }
            });
            channel.stderr.on("data", (data) => {
                if (this.ws.readyState === ws_1.WebSocket.OPEN) {
                    this.sendMessage({
                        channel: "terminal",
                        type: "data",
                        payload: data.toString("base64"),
                    });
                }
            });
            channel.on("close", () => {
                if (!this.closed) {
                    this.sendMessage({
                        channel: "terminal",
                        type: "closed",
                        payload: {},
                    });
                }
            });
        });
    }
    /**
     * Handle an incoming message on the terminal channel.
     */
    handleMessage(msg) {
        if (!this.shellChannel)
            return;
        switch (msg.type) {
            case "data": {
                // payload is base64-encoded terminal input
                const buf = Buffer.from(msg.payload, "base64");
                this.shellChannel.write(buf);
                break;
            }
            case "resize": {
                const { cols, rows } = msg.payload;
                if (cols && rows) {
                    this.shellChannel.setWindow(rows, cols, 0, 0);
                }
                break;
            }
        }
    }
    /**
     * Clean up resources.
     */
    destroy() {
        this.closed = true;
        if (this.shellChannel) {
            try {
                this.shellChannel.close();
            }
            catch {
                // already closed
            }
            this.shellChannel = null;
        }
    }
}
exports.TerminalChannel = TerminalChannel;
//# sourceMappingURL=terminalChannel.js.map