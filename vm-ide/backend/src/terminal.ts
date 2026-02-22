import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { Server } from "http";
import { getSession } from "./sessionStore";
import { ClientChannel } from "ssh2";
import { parse as parseUrl } from "url";
import { parse as parseQs } from "querystring";

export function setupTerminalWs(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req: IncomingMessage, socket, head) => {
    const { pathname, query } = parseUrl(req.url || "");
    if (pathname !== "/ws/terminal") {
      socket.destroy();
      return;
    }

    const params = parseQs(query || "");
    const sessionId = params.sessionId as string;

    if (!sessionId) {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
      socket.destroy();
      return;
    }

    const session = getSession(sessionId);
    if (!session) {
      socket.write("HTTP/1.1 404 Session Not Found\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, session);
    });
  });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage, session: any) => {
    let shellChannel: ClientChannel | null = null;

    session.conn.shell(
      { term: "xterm-256color", cols: 80, rows: 24 },
      (err: Error | undefined, channel: ClientChannel) => {
        if (err) {
          ws.send(JSON.stringify({ type: "error", message: "Failed to open shell: " + err.message }));
          ws.close();
          return;
        }

        shellChannel = channel;

        channel.on("data", (data: Buffer) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
          }
        });

        channel.stderr.on("data", (data: Buffer) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
          }
        });

        channel.on("close", () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        });
      }
    );

    ws.on("message", (msg: Buffer | string) => {
      if (!shellChannel) return;

      // Try to parse as JSON for resize messages
      if (typeof msg === "string" || (Buffer.isBuffer(msg) && msg[0] === 0x7b)) {
        try {
          const parsed = JSON.parse(msg.toString());
          if (parsed.type === "resize" && parsed.cols && parsed.rows) {
            shellChannel.setWindow(parsed.rows, parsed.cols, 0, 0);
            return;
          }
        } catch {
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
