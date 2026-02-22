import { v4 as uuidv4 } from "uuid";
import { getSession } from "../sessionStore";
import { sshExecutor } from "./sshExecutor";
import { backupManager } from "./backupManager";
import { commandRunner } from "./commandRunner";
import { logStreamer } from "./logStreamer";
import { projectConfigService } from "./projectConfig";
import {
  DeployState,
  DeployStepResult,
  DeployStatus,
  ProjectConfig,
  LogEntry,
  sftpWriteFile,
  sftpRename,
} from "../types";
import crypto from "crypto";
import path from "path";

interface DeployContext {
  deployId: string;
  sessionId: string;
  config: ProjectConfig;
  files: Array<{ path: string; content: string }>;
  startedAt: number;
  state: DeployState;
  currentStep: string;
  steps: DeployStepResult[];
  backupPaths: Map<string, string>; // filePath -> backupPath for rollback
  logs: LogEntry[];
  onStateChange?: (status: DeployStatus) => void;
}

// Key: "sessionId:projectName" -> prevents concurrent deploys
const activeDeployments = new Map<string, DeployContext>();
// Key: deployId -> context for status lookup
const deploymentIndex = new Map<string, DeployContext>();

export class DeploymentEngine {
  /**
   * Start a deployment pipeline.
   * Returns immediately with deployId; pipeline runs async.
   */
  async start(
    sessionId: string,
    files: Array<{ path: string; content: string }>,
    onStateChange?: (status: DeployStatus) => void
  ): Promise<string> {
    const session = getSession(sessionId);
    if (!session) throw new Error("Session not found or expired");

    const config = await projectConfigService.load(sessionId);
    const lockKey = `${sessionId}:${config.project.name}`;

    // Prevent concurrent deploys
    if (activeDeployments.has(lockKey)) {
      const existing = activeDeployments.get(lockKey)!;
      throw new Error(
        `Deployment already in progress (${existing.deployId}). ` +
          `Current state: ${existing.state}`
      );
    }

    const deployId = uuidv4();
    const ctx: DeployContext = {
      deployId,
      sessionId,
      config,
      files,
      startedAt: Date.now(),
      state: "idle",
      currentStep: "",
      steps: [],
      backupPaths: new Map(),
      logs: [],
      onStateChange,
    };

    activeDeployments.set(lockKey, ctx);
    deploymentIndex.set(deployId, ctx);

    // Run pipeline asynchronously
    this.runPipeline(ctx, lockKey).catch((err) => {
      console.error(`[deploy] Pipeline error for ${deployId}:`, err.message);
      this.transitionState(ctx, "failed", "pipeline_error");
    });

    return deployId;
  }

  /**
   * Get current deployment status.
   */
  getStatus(deployId: string): DeployStatus | null {
    const ctx = deploymentIndex.get(deployId);
    if (!ctx) return null;
    return this.toStatus(ctx);
  }

  /**
   * Cancel an active deployment (best-effort).
   */
  cancel(deployId: string): boolean {
    const ctx = deploymentIndex.get(deployId);
    if (!ctx) return false;

    const terminalStates: DeployState[] = ["completed", "failed", "idle"];
    if (terminalStates.includes(ctx.state)) return false;

    this.transitionState(ctx, "failed", "cancelled");
    return true;
  }

  /**
   * Trigger rollback for a failed deployment.
   */
  async rollback(deployId: string): Promise<boolean> {
    const ctx = deploymentIndex.get(deployId);
    if (!ctx || ctx.state !== "failed") return false;

    this.transitionState(ctx, "rolling_back", "rollback");

    try {
      for (const [filePath, backupPath] of ctx.backupPaths) {
        await backupManager.restoreBackup(ctx.sessionId, backupPath, filePath);
      }

      // Restart service after rollback
      const primaryService = ctx.config.services[0];
      if (primaryService) {
        const restartCmd =
          primaryService.restartCommand ||
          `systemctl restart ${primaryService.unit}`;
        await sshExecutor.exec({
          sessionId: ctx.sessionId,
          command: restartCmd,
          sudo: true,
          timeout: 30_000,
        });
      }

      this.addStep(ctx, "rollback", "rolling_back", true, "Rollback complete");
      this.transitionState(ctx, "completed", "rollback_complete");
      return true;
    } catch (err: any) {
      this.addStep(ctx, "rollback", "rolling_back", false, undefined, err.message);
      this.transitionState(ctx, "failed", "rollback_failed");
      return false;
    }
  }

  // ─── Pipeline execution ───────────────────────────────────────

  private async runPipeline(
    ctx: DeployContext,
    lockKey: string
  ): Promise<void> {
    try {
      // Step 1: Save files
      await this.stepSave(ctx);
      if (this.isFailed(ctx)) return;

      // Step 2: Run pre-validation hooks
      await this.stepValidate(ctx);
      if (this.isFailed(ctx)) return;

      // Step 3: Create backups
      await this.stepBackup(ctx);
      if (this.isFailed(ctx)) return;

      // Step 4: Deploy (restart service)
      await this.stepDeploy(ctx);
      if (this.isFailed(ctx)) return;

      // Step 5: Check status
      await this.stepCheckStatus(ctx);
      if (this.isFailed(ctx)) return;

      // Done
      this.transitionState(ctx, "completed", "deploy_complete");
    } catch (err: any) {
      this.addStep(ctx, ctx.currentStep, ctx.state, false, undefined, err.message);
      this.transitionState(ctx, "failed", ctx.currentStep);

      // Auto-fetch logs on failure
      await this.stepFetchLogs(ctx);

      // Auto-rollback if configured
      if (ctx.config.deploy.autoRollbackOnFailure && ctx.backupPaths.size > 0) {
        await this.rollback(ctx.deployId);
      }
    } finally {
      activeDeployments.delete(lockKey);
    }
  }

  private async stepSave(ctx: DeployContext): Promise<void> {
    this.transitionState(ctx, "saving", "save_files");

    if (ctx.files.length === 0) {
      this.addStep(ctx, "save_files", "saving", true, "No files to save");
      return;
    }

    const session = getSession(ctx.sessionId);
    if (!session) throw new Error("Session expired during deploy");

    for (const file of ctx.files) {
      const buf = Buffer.from(file.content, "utf-8");
      const dir = path.dirname(file.path);
      const tmpName = `.vmide-tmp.${crypto.randomBytes(6).toString("hex")}`;
      const tmpPath = path.join(dir, tmpName);

      await sftpWriteFile(session.sftp, tmpPath, buf);
      await sftpRename(session.sftp, tmpPath, file.path);
    }

    this.addStep(
      ctx,
      "save_files",
      "saving",
      true,
      `Saved ${ctx.files.length} file(s)`
    );
  }

  private async stepValidate(ctx: DeployContext): Promise<void> {
    this.transitionState(ctx, "validating", "validate");

    const hooks = ctx.config.deploy.preValidate;
    if (hooks.length === 0) {
      this.addStep(ctx, "validate", "validating", true, "No validators configured");
      return;
    }

    // Run built-in validators referenced by ID
    for (const validatorId of hooks) {
      // Check if it's a known command template (e.g., "nginx-test")
      const template = commandRunner.getTemplate(`${validatorId}-test`) ||
        commandRunner.getTemplate(validatorId);

      if (template) {
        const result = await commandRunner.runTemplate(ctx.sessionId, template.id, {});
        if (result.exitCode !== 0) {
          this.addStep(
            ctx,
            "validate",
            "validating",
            false,
            undefined,
            `Validation failed (${template.name}):\n${result.stderr || result.stdout}`
          );
          this.transitionState(ctx, "failed", "validate");
          return;
        }
      } else {
        // Treat as custom command
        const result = await sshExecutor.exec({
          sessionId: ctx.sessionId,
          command: validatorId,
          timeout: 15_000,
        });
        if (result.exitCode !== 0) {
          this.addStep(
            ctx,
            "validate",
            "validating",
            false,
            undefined,
            `Validation failed:\n${result.stderr || result.stdout}`
          );
          this.transitionState(ctx, "failed", "validate");
          return;
        }
      }
    }

    this.addStep(
      ctx,
      "validate",
      "validating",
      true,
      `Passed ${hooks.length} validation(s)`
    );
  }

  private async stepBackup(ctx: DeployContext): Promise<void> {
    this.transitionState(ctx, "backing_up", "backup");

    for (const file of ctx.files) {
      try {
        const backup = await backupManager.createBackup(ctx.sessionId, file.path);
        if (backup) {
          ctx.backupPaths.set(file.path, backup.path);
        }
      } catch (err: any) {
        // Non-fatal: log but continue
        console.warn(`[deploy] Backup warning for ${file.path}: ${err.message}`);
      }
    }

    this.addStep(
      ctx,
      "backup",
      "backing_up",
      true,
      `Created ${ctx.backupPaths.size} backup(s)`
    );
  }

  private async stepDeploy(ctx: DeployContext): Promise<void> {
    this.transitionState(ctx, "deploying", "deploy_service");

    // Pre-deploy hooks
    for (const hook of ctx.config.deploy.preDeployHooks) {
      const result = await sshExecutor.exec({
        sessionId: ctx.sessionId,
        command: hook,
        timeout: 60_000,
      });
      if (result.exitCode !== 0) {
        this.addStep(
          ctx,
          "deploy_service",
          "deploying",
          false,
          undefined,
          `Pre-deploy hook failed: ${hook}\n${result.stderr}`
        );
        this.transitionState(ctx, "failed", "deploy_service");
        return;
      }
    }

    // Restart primary service
    const primaryService = ctx.config.services[0];
    if (primaryService) {
      const restartCmd =
        primaryService.restartCommand ||
        `systemctl restart ${primaryService.unit}`;
      const result = await sshExecutor.exec({
        sessionId: ctx.sessionId,
        command: restartCmd,
        sudo: true,
        timeout: 30_000,
      });
      if (result.exitCode !== 0) {
        this.addStep(
          ctx,
          "deploy_service",
          "deploying",
          false,
          undefined,
          `Service restart failed:\n${result.stderr}`
        );
        this.transitionState(ctx, "failed", "deploy_service");
        return;
      }
    }

    // Post-deploy hooks
    for (const hook of ctx.config.deploy.postDeployHooks) {
      const result = await sshExecutor.exec({
        sessionId: ctx.sessionId,
        command: hook,
        timeout: 60_000,
      });
      if (result.exitCode !== 0) {
        console.warn(`[deploy] Post-deploy hook failed: ${hook}`);
        // Post-deploy hook failures are warnings, not deploy failures
      }
    }

    this.addStep(ctx, "deploy_service", "deploying", true, "Service restarted");
  }

  private async stepCheckStatus(ctx: DeployContext): Promise<void> {
    this.transitionState(ctx, "checking_status", "check_status");

    const primaryService = ctx.config.services[0];
    if (!primaryService) {
      this.addStep(
        ctx,
        "check_status",
        "checking_status",
        true,
        "No service configured — skipping status check"
      );
      return;
    }

    // Wait a moment for the service to stabilize
    await sleep(2000);

    const statusCmd =
      primaryService.statusCommand ||
      `systemctl is-active ${primaryService.unit}`;
    const result = await sshExecutor.exec({
      sessionId: ctx.sessionId,
      command: statusCmd,
      timeout: 10_000,
    });

    const isActive =
      result.exitCode === 0 &&
      (result.stdout.trim() === "active" ||
        result.stdout.includes("active (running)") ||
        result.exitCode === 0);

    if (!isActive) {
      this.addStep(
        ctx,
        "check_status",
        "checking_status",
        false,
        undefined,
        `Service is not healthy:\n${result.stdout}\n${result.stderr}`
      );
      this.transitionState(ctx, "failed", "check_status");

      // Auto-fetch logs on failure
      await this.stepFetchLogs(ctx);
      return;
    }

    this.addStep(
      ctx,
      "check_status",
      "checking_status",
      true,
      `Service is active`
    );
  }

  private async stepFetchLogs(ctx: DeployContext): Promise<void> {
    this.transitionState(ctx, "fetching_logs", "fetch_logs");

    const primaryService = ctx.config.services[0];
    if (!primaryService) return;

    try {
      ctx.logs = await logStreamer.fetchLogs(
        ctx.sessionId,
        primaryService.unit,
        50
      );
      this.addStep(
        ctx,
        "fetch_logs",
        "fetching_logs",
        true,
        `Fetched ${ctx.logs.length} log entries`
      );
    } catch (err: any) {
      this.addStep(
        ctx,
        "fetch_logs",
        "fetching_logs",
        false,
        undefined,
        err.message
      );
    }

    // Return to failed state after fetching logs
    ctx.state = "failed";
    ctx.onStateChange?.(this.toStatus(ctx));
  }

  private isFailed(ctx: DeployContext): boolean {
    return (ctx.state as string) === "failed";
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private transitionState(
    ctx: DeployContext,
    state: DeployState,
    step: string
  ): void {
    ctx.state = state;
    ctx.currentStep = step;
    if (state === "completed" || state === "failed") {
      (ctx as any).completedAt = Date.now();
    }
    ctx.onStateChange?.(this.toStatus(ctx));
  }

  private addStep(
    ctx: DeployContext,
    step: string,
    state: DeployState,
    success: boolean,
    output?: string,
    error?: string
  ): void {
    ctx.steps.push({
      step,
      state,
      success,
      output,
      error,
      durationMs: Date.now() - ctx.startedAt,
    });
  }

  private toStatus(ctx: DeployContext): DeployStatus {
    return {
      deployId: ctx.deployId,
      state: ctx.state,
      currentStep: ctx.currentStep,
      steps: [...ctx.steps],
      startedAt: ctx.startedAt,
      completedAt: (ctx as any).completedAt,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const deploymentEngine = new DeploymentEngine();
