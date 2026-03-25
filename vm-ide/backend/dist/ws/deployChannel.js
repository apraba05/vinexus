"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeployChannel = void 0;
const deploymentEngine_1 = require("../services/deploymentEngine");
/**
 * Handles the 'deploy' channel for deployment pipeline events.
 */
class DeployChannel {
    ws;
    session;
    sendMessage;
    activeDeployId = null;
    constructor(ws, session, sendMessage) {
        this.ws = ws;
        this.session = session;
        this.sendMessage = sendMessage;
    }
    async handleMessage(msg) {
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
    async startDeploy(payload) {
        const files = payload.files || [];
        try {
            const deployId = await deploymentEngine_1.deploymentEngine.start(this.session.id, files, (status) => {
                // Push state changes to client in real-time
                this.sendMessage({
                    channel: "deploy",
                    type: "state_change",
                    payload: status,
                });
            });
            this.activeDeployId = deployId;
            const status = deploymentEngine_1.deploymentEngine.getStatus(deployId);
            this.sendMessage({
                channel: "deploy",
                type: "started",
                payload: status,
            });
        }
        catch (err) {
            this.sendMessage({
                channel: "deploy",
                type: "error",
                payload: { message: err.message },
            });
        }
    }
    getStatus(payload) {
        const deployId = payload.deployId || this.activeDeployId;
        if (!deployId) {
            this.sendMessage({
                channel: "deploy",
                type: "error",
                payload: { message: "No active deployment" },
            });
            return;
        }
        const status = deploymentEngine_1.deploymentEngine.getStatus(deployId);
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
    cancelDeploy(payload) {
        const deployId = payload.deployId || this.activeDeployId;
        if (!deployId)
            return;
        const cancelled = deploymentEngine_1.deploymentEngine.cancel(deployId);
        this.sendMessage({
            channel: "deploy",
            type: cancelled ? "cancelled" : "error",
            payload: cancelled
                ? { deployId }
                : { message: "Cannot cancel deployment" },
        });
    }
    async rollbackDeploy(payload) {
        const deployId = payload.deployId || this.activeDeployId;
        if (!deployId)
            return;
        const success = await deploymentEngine_1.deploymentEngine.rollback(deployId);
        this.sendMessage({
            channel: "deploy",
            type: success ? "rolled_back" : "error",
            payload: success
                ? { deployId }
                : { message: "Rollback failed" },
        });
    }
    destroy() {
        // Cancel active deploy on disconnect
        if (this.activeDeployId) {
            deploymentEngine_1.deploymentEngine.cancel(this.activeDeployId);
        }
    }
}
exports.DeployChannel = DeployChannel;
//# sourceMappingURL=deployChannel.js.map