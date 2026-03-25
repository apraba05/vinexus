import { DeployStatus } from "../types";
export declare class DeploymentEngine {
    /**
     * Start a deployment pipeline.
     * Returns immediately with deployId; pipeline runs async.
     */
    start(sessionId: string, files: Array<{
        path: string;
        content: string;
    }>, onStateChange?: (status: DeployStatus) => void): Promise<string>;
    /**
     * Get current deployment status.
     */
    getStatus(deployId: string): DeployStatus | null;
    /**
     * Cancel an active deployment (best-effort).
     */
    cancel(deployId: string): boolean;
    /**
     * Trigger rollback for a failed deployment.
     */
    rollback(deployId: string): Promise<boolean>;
    private runPipeline;
    private sanitizeSteps;
    private persistDeployment;
    private stepSave;
    private stepValidate;
    private stepBackup;
    private stepDeploy;
    private stepCheckStatus;
    private stepFetchLogs;
    private isFailed;
    private transitionState;
    private addStep;
    private toStatus;
}
export declare const deploymentEngine: DeploymentEngine;
//# sourceMappingURL=deploymentEngine.d.ts.map