import { WebSocket } from "ws";
import { Session } from "../sessionStore";
import { WSMessage } from "../types";
import { sshExecutor } from "../services/sshExecutor";
import { commandRunner } from "../services/commandRunner";
import { v4 as uuidv4 } from "uuid";

/**
 * Handles the 'exec' channel for streaming command execution output
 * over the multiplexed WebSocket.
 */
export class ExecChannel {
  constructor(
    private ws: WebSocket,
    private session: Session,
    private sendMessage: (msg: WSMessage) => void
  ) {}

  /**
   * Handle an incoming message on the exec channel.
   */
  async handleMessage(msg: WSMessage): Promise<void> {
    switch (msg.type) {
      case "run_template":
        await this.runTemplate(msg.payload);
        break;
      case "run_custom":
        await this.runCustom(msg.payload);
        break;
    }
  }

  private async runTemplate(payload: {
    templateId: string;
    params?: Record<string, string | number>;
    execId?: string;
  }): Promise<void> {
    const execId = payload.execId || uuidv4();
    const { templateId, params = {} } = payload;

    const template = commandRunner.getTemplate(templateId);
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
      const result = await commandRunner.runTemplate(
        this.session.id,
        templateId,
        params
      );

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
    } catch (err: any) {
      this.sendMessage({
        channel: "exec",
        type: "error",
        payload: { execId, error: err.message },
      });
    }
  }

  private async runCustom(payload: {
    command: string;
    sudo?: boolean;
    timeout?: number;
    execId?: string;
  }): Promise<void> {
    const execId = payload.execId || uuidv4();

    this.sendMessage({
      channel: "exec",
      type: "started",
      payload: { execId, command: payload.command },
    });

    try {
      const result = await sshExecutor.execStreaming(
        {
          sessionId: this.session.id,
          command: payload.command,
          sudo: payload.sudo,
          timeout: payload.timeout,
        },
        (line) => {
          this.sendMessage({
            channel: "exec",
            type: "output",
            payload: { execId, stream: "stdout", line },
          });
        },
        (line) => {
          this.sendMessage({
            channel: "exec",
            type: "output",
            payload: { execId, stream: "stderr", line },
          });
        }
      );

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
    } catch (err: any) {
      this.sendMessage({
        channel: "exec",
        type: "error",
        payload: { execId, error: err.message },
      });
    }
  }

  destroy(): void {
    // No persistent state to clean up
  }
}
