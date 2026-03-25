"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTerminalWs = setupTerminalWs;
const ws_1 = require("ws");
const sessionStore_1 = require("./sessionStore");
const url_1 = require("url");
const querystring_1 = require("querystring");
function setupTerminalWs(server) {
    const wss = new ws_1.WebSocketServer({ noServer: true });
    server.on("upgrade", (req, socket, head) => {
        const { pathname, query } = (0, url_1.parse)(req.url || "");
        if (pathname !== "/ws/terminal") {
            socket.destroy();
            return;
        }
        const params = (0, querystring_1.parse)(query || "");
        const sessionId = params.sessionId;
        if (!sessionId) {
            socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
            socket.destroy();
            return;
        }
        const session = (0, sessionStore_1.getSession)(sessionId);
        if (!session) {
            socket.write("HTTP/1.1 404 Session Not Found\r\n\r\n");
            socket.destroy();
            return;
        }
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req, session);
        });
    });
    wss.on("connection", (ws, _req, session) => {
        let shellChannel = null;
        session.conn.shell({ term: "xterm-256color", cols: 80, rows: 24 }, (err, channel) => {
            if (err) {
                ws.send(JSON.stringify({ type: "error", message: "Failed to open shell: " + err.message }));
                ws.close();
                return;
            }
            shellChannel = channel;
            channel.on("data", (data) => {
                if (ws.readyState === ws_1.WebSocket.OPEN) {
                    ws.send(data);
                }
            });
            channel.stderr.on("data", (data) => {
                if (ws.readyState === ws_1.WebSocket.OPEN) {
                    ws.send(data);
                }
            });
            channel.on("close", () => {
                if (ws.readyState === ws_1.WebSocket.OPEN) {
                    ws.close();
                }
            });
        });
        ws.on("message", (msg) => {
            if (!shellChannel)
                return;
            // Try to parse as JSON for resize messages
            if (typeof msg === "string" || (Buffer.isBuffer(msg) && msg[0] === 0x7b)) {
                try {
                    const parsed = JSON.parse(msg.toString());
                    if (parsed.type === "resize" && parsed.cols && parsed.rows) {
                        shellChannel.setWindow(parsed.rows, parsed.cols, 0, 0);
                        return;
                    }
                }
                catch {
                    // Not JSON, treat as input
                }
            }
            shellChannel.write(msg);
        });
        ws.on("close", () => {
            if (shellChannel) {
                shellChannel.close();
            }
        });
        ws.on("error", (err) => {
            console.error("[terminal] WebSocket error:", err.message);
            if (shellChannel) {
                shellChannel.close();
            }
        });
    });
}
//# sourceMappingURL=terminal.js.map