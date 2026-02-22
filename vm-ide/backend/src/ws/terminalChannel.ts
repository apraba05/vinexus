import { WebSocket } from "ws";
import { ClientChannel } from "ssh2";
import { Session } from "../sessionStore";
import { WSMessage } from "../types";

/**
 * Handles the 'terminal' channel within the multiplexed WebSocket.
 * Opens an SSH shell and bridges I/O between the WS client and the shell.
 */
export class TerminalChannel {
  private shellChannel: ClientChannel | null = null;
  private closed = false;

  constructor(
    private ws: WebSocket,
    private session: Session,
    private sendMessage: (msg: WSMessage) => void
  ) {}

  /**
   * Initialize the shell channel.
   */
  start(): void {
    this.session.conn.shell(
      { term: "xterm-256color", cols: 80, rows: 24 },
      (err: Error | undefined, channel: ClientChannel) => {
        if (err) {
          this.sendMessage({
            channel: "terminal",
            type: "error",
            payload: { message: "Failed to open shell: " + err.message },
          });
          return;
        }

        this.shellChannel = channel;

        channel.on("data", (data: Buffer) => {
          if (this.ws.readyState === WebSocket.OPEN) {
            this.sendMessage({
              channel: "terminal",
              type: "data",
              payload: data.toString("base64"),
            });
          }
        });

        channel.stderr.on("data", (data: Buffer) => {
          if (this.ws.readyState === WebSocket.OPEN) {
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
      }
    );
  }

  /**
   * Handle an incoming message on the terminal channel.
   */
  handleMessage(msg: WSMessage): void {
    if (!this.shellChannel) return;

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
  destroy(): void {
    this.closed = true;
    if (this.shellChannel) {
      try {
        this.shellChannel.close();
      } catch {
        // already closed
      }
      this.shellChannel = null;
    }
  }
}
