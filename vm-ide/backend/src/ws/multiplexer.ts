import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage, Server } from "http";
import { parse as parseUrl } from "url";
import { parse as parseQs } from "querystring";
import { getSession, Session } from "../sessionStore";
import { WSMessage } from "../types";
import { TerminalChannel } from "./terminalChannel";
import { ExecChannel } from "./execChannel";
import { LogsChannel } from "./logsChannel";
import { DeployChannel } from "./deployChannel";
import { AgentChannel } from "./agentChannel";
import { ClientChannel } from "ssh2";

/**
 * Sets up the multiplexed WebSocket server on /ws/session?sessionId=X
 * and keeps the legacy /ws/terminal endpoint for backward compatibility.
 */
export function setupWebSockets(server: Server): void {
  const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
  const MAX_PAYLOAD = 1 * 1024 * 1024; // 1MB max WebSocket message size

  const multiplexWss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });
  const legacyWss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });

  // ─── Security: Validate WebSocket origin ─────────────────────
  function isOriginAllowed(req: IncomingMessage): boolean {
    const origin = req.headers.origin;
    if (!origin) return true; // Server-to-server or same-origin (no Origin header)
    try {
      const allowed = new URL(FRONTEND_ORIGIN);
      const incoming = new URL(origin);
      return allowed.host === incoming.host;
    } catch {
      return false;
    }
  }

  server.on("upgrade", (req: IncomingMessage, socket, head) => {
    const { pathname, query } = parseUrl(req.url || "");
    const params = parseQs(query || "");
    const sessionId = params.sessionId as string;

    // ─── Security: Reject unauthorized origins ───
    if (!isOriginAllowed(req)) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }

    if (pathname === "/ws/session") {
      // ─── Multiplexed endpoint ───
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

      multiplexWss.handleUpgrade(req, socket, head, (ws) => {
        multiplexWss.emit("connection", ws, req, session);
      });
    } else if (pathname === "/ws/terminal") {
      // ─── Legacy terminal endpoint (backward compat) ───
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

      legacyWss.handleUpgrade(req, socket, head, (ws) => {
        legacyWss.emit("connection", ws, req, session);
      });
    } else {
      socket.destroy();
    }
  });

  // ─── Multiplexed connection handler ───
  multiplexWss.on(
    "connection",
    (ws: WebSocket, _req: IncomingMessage, session: any) => {
      const sendMessage = (msg: WSMessage) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(msg));
        }
      };

      // Initialize channel handlers
      const terminalChannel = new TerminalChannel(ws, session, sendMessage);
      const execChannel = new ExecChannel(ws, session, sendMessage);
      const logsChannel = new LogsChannel(ws, session, sendMessage);
      const deployChannel = new DeployChannel(ws, session, sendMessage);
      const agentChannel = new AgentChannel(ws, session, sendMessage);

      // Start terminal automatically
      terminalChannel.start();

      // Heartbeat
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }, 30_000);

      ws.on("message", (raw: Buffer | string) => {
        let msg: WSMessage;
        try {
          msg = JSON.parse(raw.toString());
        } catch {
          // Invalid message — ignore
          return;
        }

        if (!msg.channel || !msg.type) return;

        switch (msg.channel) {
          case "terminal":
            terminalChannel.handleMessage(msg);
            break;
          case "exec":
            execChannel.handleMessage(msg);
            break;
          case "logs":
            logsChannel.handleMessage(msg);
            break;
          case "deploy":
            deployChannel.handleMessage(msg);
            break;
          case "agent":
            agentChannel.handleMessage(msg);
            break;
          default:
            sendMessage({
              channel: "system",
              type: "error",
              payload: { message: "Unknown channel: " + msg.channel },
            });
        }
      });

      ws.on("close", () => {
        clearInterval(pingInterval);
        terminalChannel.destroy();
        execChannel.destroy();
        logsChannel.destroy();
        deployChannel.destroy();
        agentChannel.destroy();
      });

      ws.on("error", (err) => {
        console.error("[ws/multiplexer] WebSocket error:", err.message);
        clearInterval(pingInterval);
        terminalChannel.destroy();
        execChannel.destroy();
        logsChannel.destroy();
        deployChannel.destroy();
        agentChannel.destroy();
      });

      // Confirm connection
      sendMessage({
        channel: "system",
        type: "connected",
        payload: { sessionId: session.id, host: session.host },
      });
    }
  );

  // ─── Legacy terminal connection handler ───
  // CWD detection: We inject a PROMPT_COMMAND that emits an OSC escape sequence
  // containing the current directory after each command. The handler scans for
  // this pattern and sends CWD changes as JSON messages to the frontend.
  // The injection is completely hidden from the user via a setup phase.
  const CWD_REGEX = /\x1b\]7;CWD:([^\x07]+)\x07/g;
  // Build PROMPT_COMMAND string with concatenation to prevent TS from
  // interpreting the shell variable ${PWD} as a template expression.
  const PROMPT_CMD_SETUP =
    " export PROMPT_COMMAND='echo -ne \"\\033]7;CWD:" +
    "${PWD}" +
    "\\007\"'\r";

  legacyWss.on(
    "connection",
    (ws: WebSocket, _req: IncomingMessage, session: any) => {
      let shellChannel: ClientChannel | null = null;
      let lastCwd: string | null = null;
      let setupDone = false;

      session.conn.shell(
        { term: "xterm-256color", cols: 80, rows: 24 },
        (err: Error | undefined, channel: ClientChannel) => {
          if (err) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Failed to open shell: " + err.message,
              })
            );
            ws.close();
            return;
          }

          shellChannel = channel;

          // ─── Silent setup phase ───
          // During setup, all output is suppressed so the user
          // doesn't see the PROMPT_COMMAND injection.
          // 1. Wait for shell to initialize (.bashrc, motd, etc.)
          // 2. Inject PROMPT_COMMAND (leading space = no bash history)
          // 3. Clear screen to hide all setup artifacts
          // 4. Start forwarding output — user sees a clean terminal
          setTimeout(() => {
            channel.write(PROMPT_CMD_SETUP);
            // After PROMPT_COMMAND is set, clear the screen and
            // trigger it once so the initial CWD is reported
            setTimeout(() => {
              channel.write(" clear\r");
              setTimeout(() => {
                setupDone = true;
                // Send empty Enter to trigger a fresh prompt
                // so the user sees [user@host ~]$ on connect
                channel.write("\r");
              }, 150);
            }, 150);
          }, 300);

          channel.on("data", (data: Buffer) => {
            if (ws.readyState !== WebSocket.OPEN) return;

            const str = data.toString("utf-8");

            // Always extract CWD from OSC sequences (even during setup)
            let match: RegExpExecArray | null;
            CWD_REGEX.lastIndex = 0;
            while ((match = CWD_REGEX.exec(str)) !== null) {
              const cwd = match[1];
              if (cwd && cwd !== lastCwd) {
                lastCwd = cwd;
                ws.send(JSON.stringify({ type: "cwd", path: cwd }));
              }
            }

            // During setup phase, suppress all terminal output
            if (!setupDone) return;

            // Strip the OSC CWD sequences from the data before forwarding
            const cleaned = str.replace(CWD_REGEX, "");
            if (cleaned.length > 0) {
              ws.send(Buffer.from(cleaned, "utf-8"));
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

        if (
          typeof msg === "string" ||
          (Buffer.isBuffer(msg) && msg[0] === 0x7b)
        ) {
          try {
            const parsed = JSON.parse(msg.toString());
            if (parsed.type === "resize" && parsed.cols && parsed.rows) {
              shellChannel.setWindow(parsed.rows, parsed.cols, 0, 0);
              return;
            }
          } catch {
            // Not JSON
          }
        }

        shellChannel.write(msg);
      });

      ws.on("close", () => {
        if (shellChannel) shellChannel.close();
      });

      ws.on("error", (err) => {
        console.error("[terminal] WebSocket error:", err.message);
        if (shellChannel) shellChannel.close();
      });
    }
  );
}
