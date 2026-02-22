/**
 * Multiplexed WebSocket client for VM-IDE.
 *
 * Wraps a single WebSocket connection to /ws/session and routes
 * messages to channel-specific handlers.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type WSChannel = "terminal" | "logs" | "deploy" | "exec" | "system";

export interface WSMessage {
  channel: WSChannel;
  type: string;
  payload: any;
}

type MessageHandler = (msg: WSMessage) => void;

export class WSClient {
  private ws: WebSocket | null = null;
  private channelHandlers = new Map<string, Set<MessageHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _state: "disconnected" | "connecting" | "connected" = "disconnected";
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  get state() {
    return this._state;
  }

  /**
   * Connect to the multiplexed WebSocket endpoint.
   */
  connect(): void {
    if (this.ws) return;

    this._state = "connecting";
    const wsBase = API_BASE.replace(/^http/, "ws");
    const url = `${wsBase}/ws/session?sessionId=${encodeURIComponent(this.sessionId)}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this._state = "connected";
      this.emit("system", { channel: "system", type: "connected", payload: {} });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(
          typeof event.data === "string"
            ? event.data
            : new TextDecoder().decode(event.data)
        );
        this.emit(msg.channel, msg);
      } catch {
        // Non-JSON message — ignore
      }
    };

    this.ws.onclose = () => {
      this._state = "disconnected";
      this.ws = null;
      this.emit("system", {
        channel: "system",
        type: "disconnected",
        payload: {},
      });
    };

    this.ws.onerror = () => {
      // onclose will fire after this
    };
  }

  /**
   * Disconnect and clean up.
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._state = "disconnected";
    this.channelHandlers.clear();
  }

  /**
   * Subscribe to messages on a specific channel.
   * Returns an unsubscribe function.
   */
  on(channel: string, handler: MessageHandler): () => void {
    if (!this.channelHandlers.has(channel)) {
      this.channelHandlers.set(channel, new Set());
    }
    this.channelHandlers.get(channel)!.add(handler);
    return () => {
      this.channelHandlers.get(channel)?.delete(handler);
    };
  }

  /**
   * Send a message on a specific channel.
   */
  send(channel: WSChannel, type: string, payload: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ channel, type, payload }));
    }
  }

  /**
   * Terminal convenience: send raw data (base64-encoded).
   */
  sendTerminalData(data: string | Uint8Array): void {
    const b64 =
      typeof data === "string"
        ? btoa(data)
        : btoa(String.fromCharCode(...data));
    this.send("terminal", "data", b64);
  }

  /**
   * Terminal convenience: send resize.
   */
  sendTerminalResize(cols: number, rows: number): void {
    this.send("terminal", "resize", { cols, rows });
  }

  private emit(channel: string, msg: WSMessage): void {
    const handlers = this.channelHandlers.get(channel);
    if (handlers) {
      for (const h of handlers) {
        try {
          h(msg);
        } catch (err) {
          console.error(`[wsClient] Handler error on ${channel}:`, err);
        }
      }
    }
  }
}
