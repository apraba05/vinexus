import { WebSocket } from "ws";
import { Session } from "../sessionStore";
import { WSMessage } from "../types";
import { logStreamer } from "../services/logStreamer";

/**
 * Handles the 'logs' channel for real-time log streaming.
 */
export class LogsChannel {
  private streamHandle: { stop: () => void } | null = null;

  constructor(
    private ws: WebSocket,
    private session: Session,
    private sendMessage: (msg: WSMessage) => void
  ) {}

  async handleMessage(msg: WSMessage): Promise<void> {
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

  private async subscribe(payload: {
    service: string;
  }): Promise<void> {
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
      this.streamHandle = await logStreamer.startStreaming(
        this.session.id,
        service,
        (entry) => {
          this.sendMessage({
            channel: "logs",
            type: "entry",
            payload: entry,
          });
        },
        (error) => {
          this.sendMessage({
            channel: "logs",
            type: "error",
            payload: { message: error },
          });
        }
      );

      this.sendMessage({
        channel: "logs",
        type: "subscribed",
        payload: { service },
      });
    } catch (err: any) {
      this.sendMessage({
        channel: "logs",
        type: "error",
        payload: { message: err.message },
      });
    }
  }

  private unsubscribe(): void {
    if (this.streamHandle) {
      this.streamHandle.stop();
      this.streamHandle = null;
    }
  }

  private async fetch(payload: {
    service: string;
    lines?: number;
  }): Promise<void> {
    const { service, lines = 50 } = payload;

    try {
      const entries = await logStreamer.fetchLogs(
        this.session.id,
        service,
        lines
      );
      this.sendMessage({
        channel: "logs",
        type: "batch",
        payload: { service, entries },
      });
    } catch (err: any) {
      this.sendMessage({
        channel: "logs",
        type: "error",
        payload: { message: err.message },
      });
    }
  }

  destroy(): void {
    this.unsubscribe();
  }
}
