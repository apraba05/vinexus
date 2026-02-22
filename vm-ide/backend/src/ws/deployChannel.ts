import { WebSocket } from "ws";
import { Session } from "../sessionStore";
import { WSMessage, DeployStatus } from "../types";
import { deploymentEngine } from "../services/deploymentEngine";

/**
 * Handles the 'deploy' channel for deployment pipeline events.
 */
export class DeployChannel {
  private activeDeployId: string | null = null;

  constructor(
    private ws: WebSocket,
    private session: Session,
    private sendMessage: (msg: WSMessage) => void
  ) {}

  async handleMessage(msg: WSMessage): Promise<void> {
    switch (msg.type) {
      case "start":
        await this.startDeploy(msg.payload);
        break;
      case "status":
        this.getStatus(msg.payload);
        break;
      case "cancel":
        this.cancelDeploy(msg.payload);
        break;
      case "rollback":
        await this.rollbackDeploy(msg.payload);
        break;
    }
  }

  private async startDeploy(payload: {
    files?: Array<{ path: string; content: string }>;
  }): Promise<void> {
    const files = payload.files || [];

    try {
      const deployId = await deploymentEngine.start(
        this.session.id,
        files,
        (status: DeployStatus) => {
          // Push state changes to client in real-time
          this.sendMessage({
            channel: "deploy",
            type: "state_change",
            payload: status,
          });
        }
      );

      this.activeDeployId = deployId;

      const status = deploymentEngine.getStatus(deployId);
      this.sendMessage({
        channel: "deploy",
        type: "started",
        payload: status,
      });
    } catch (err: any) {
      this.sendMessage({
        channel: "deploy",
        type: "error",
        payload: { message: err.message },
      });
    }
  }

  private getStatus(payload: { deployId?: string }): void {
    const deployId = payload.deployId || this.activeDeployId;
    if (!deployId) {
      this.sendMessage({
        channel: "deploy",
        type: "error",
        payload: { message: "No active deployment" },
      });
      return;
    }

    const status = deploymentEngine.getStatus(deployId);
    if (!status) {
      this.sendMessage({
        channel: "deploy",
        type: "error",
        payload: { message: "Deployment not found" },
      });
      return;
    }

    this.sendMessage({
      channel: "deploy",
      type: "state_change",
      payload: status,
    });
  }

  private cancelDeploy(payload: { deployId?: string }): void {
    const deployId = payload.deployId || this.activeDeployId;
    if (!deployId) return;

    const cancelled = deploymentEngine.cancel(deployId);
    this.sendMessage({
      channel: "deploy",
      type: cancelled ? "cancelled" : "error",
      payload: cancelled
        ? { deployId }
        : { message: "Cannot cancel deployment" },
    });
  }

  private async rollbackDeploy(payload: { deployId?: string }): Promise<void> {
    const deployId = payload.deployId || this.activeDeployId;
    if (!deployId) return;

    const success = await deploymentEngine.rollback(deployId);
    this.sendMessage({
      channel: "deploy",
      type: success ? "rolled_back" : "error",
      payload: success
        ? { deployId }
        : { message: "Rollback failed" },
    });
  }

  destroy(): void {
    // Cancel active deploy on disconnect
    if (this.activeDeployId) {
      deploymentEngine.cancel(this.activeDeployId);
    }
  }
}
