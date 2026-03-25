"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deploymentEngine = exports.DeploymentEngine = void 0;
const uuid_1 = require("uuid");
const sessionStore_1 = require("../sessionStore");
const sshExecutor_1 = require("./sshExecutor");
const backupManager_1 = require("./backupManager");
const commandRunner_1 = require("./commandRunner");
const logStreamer_1 = require("./logStreamer");
const projectConfig_1 = require("./projectConfig");
const types_1 = require("../types");
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Key: "sessionId:projectName" -> prevents concurrent deploys
const activeDeployments = new Map();
// Key: deployId -> context for status lookup
const deploymentIndex = new Map();
class DeploymentEngine {
    /**
     * Start a deployment pipeline.
     * Returns immediately with deployId; pipeline runs async.
     */
    async start(sessionId, files, onStateChange) {
        const session = (0, sessionStore_1.getSession)(sessionId);
        if (!session)
            throw new Error("Session not found or expired");
        const config = await projectConfig_1.projectConfigService.load(sessionId);
        const lockKey = `${sessionId}:${config.project.name}`;
        // Prevent concurrent deploys
        if (activeDeployments.has(lockKey)) {
            const existing = activeDeployments.get(lockKey);
            throw new Error(`Deployment already in progress (${existing.deployId}). ` +
                `Current state: ${existing.state}`);
        }
        const deployId = (0, uuid_1.v4)();
        const ctx = {
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
    getStatus(deployId) {
        const ctx = deploymentIndex.get(deployId);
        if (!ctx)
            return null;
        return this.toStatus(ctx);
    }
    /**
     * Cancel an active deployment (best-effort).
     */
    cancel(deployId) {
        const ctx = deploymentIndex.get(deployId);
        if (!ctx)
            return false;
        const terminalStates = ["completed", "failed", "idle"];
        if (terminalStates.includes(ctx.state))
            return false;
        this.transitionState(ctx, "failed", "cancelled");
        return true;
    }
    /**
     * Trigger rollback for a failed deployment.
     */
    async rollback(deployId) {
        const ctx = deploymentIndex.get(deployId);
        if (!ctx || ctx.state !== "failed")
            return false;
        this.transitionState(ctx, "rolling_back", "rollback");
        try {
            for (const [filePath, backupPath] of ctx.backupPaths) {
                await backupManager_1.backupManager.restoreBackup(ctx.sessionId, backupPath, filePath);
            }
            // Restart service after rollback
            const primaryService = ctx.config.services[0];
            if (primaryService) {
                const restartCmd = primaryService.restartCommand ||
                    `systemctl restart ${primaryService.unit}`;
                await sshExecutor_1.sshExecutor.exec({
                    sessionId: ctx.sessionId,
                    command: restartCmd,
                    sudo: true,
                    timeout: 30_000,
                });
            }
            this.addStep(ctx, "rollback", "rolling_back", true, "Rollback complete");
            this.transitionState(ctx, "completed", "rollback_complete");
            return true;
        }
        catch (err) {
            this.addStep(ctx, "rollback", "rolling_back", false, undefined, err.message);
            this.transitionState(ctx, "failed", "rollback_failed");
            return false;
        }
    }
    // ─── Pipeline execution ───────────────────────────────────────
    async runPipeline(ctx, lockKey) {
        try {
            // Step 1: Save files
            await this.stepSave(ctx);
            if (this.isFailed(ctx))
                return;
            // Step 2: Run pre-validation hooks
            await this.stepValidate(ctx);
            if (this.isFailed(ctx))
                return;
            // Step 3: Create backups
            await this.stepBackup(ctx);
            if (this.isFailed(ctx))
                return;
            // Step 4: Deploy (restart service)
            await this.stepDeploy(ctx);
            if (this.isFailed(ctx))
                return;
            // Step 5: Check status
            await this.stepCheckStatus(ctx);
            if (this.isFailed(ctx))
                return;
            // Done
            this.transitionState(ctx, "completed", "deploy_complete");
        }
        catch (err) {
            this.addStep(ctx, ctx.currentStep, ctx.state, false, undefined, err.message);
            this.transitionState(ctx, "failed", ctx.currentStep);
            // Auto-fetch logs on failure
            await this.stepFetchLogs(ctx);
            // Auto-rollback if configured
            if (ctx.config.deploy.autoRollbackOnFailure && ctx.backupPaths.size > 0) {
                await this.rollback(ctx.deployId);
            }
        }
        finally {
            activeDeployments.delete(lockKey);
            // Persist deployment record — non-fatal if DB is unavailable
            this.persistDeployment(ctx).catch((err) => console.warn("[deploy] Failed to persist deployment record:", err.message));
        }
    }
    sanitizeSteps(steps) {
        // Redact credential-like patterns from command output before persisting to DB.
        const REDACT_RE = /(\b(?:password|passwd|secret|token|api[_-]?key|auth(?:orization)?|bearer|private[_-]?key|access[_-]?key)\s*[=:]\s*)\S+/gi;
        const redact = (s) => s?.replace(REDACT_RE, "$1[REDACTED]");
        return steps.map((s) => ({
            ...s,
            output: redact(s.output),
            error: redact(s.error),
        }));
    }
    async persistDeployment(ctx) {
        await prisma.deployment.create({
            data: {
                sshSessionId: ctx.sessionId,
                projectName: ctx.config.project.name,
                status: ctx.state === "completed" ? "completed" : "failed",
                startedAt: new Date(ctx.startedAt),
                completedAt: ctx.completedAt ? new Date(ctx.completedAt) : null,
                steps: this.sanitizeSteps(ctx.steps),
                filesChanged: ctx.files.length,
            },
        });
    }
    async stepSave(ctx) {
        this.transitionState(ctx, "saving", "save_files");
        if (ctx.files.length === 0) {
            this.addStep(ctx, "save_files", "saving", true, "No files to save");
            return;
        }
        const session = (0, sessionStore_1.getSession)(ctx.sessionId);
        if (!session)
            throw new Error("Session expired during deploy");
        for (const file of ctx.files) {
            const buf = Buffer.from(file.content, "utf-8");
            const dir = path_1.default.dirname(file.path);
            const tmpName = `.vmide-tmp.${crypto_1.default.randomBytes(6).toString("hex")}`;
            const tmpPath = path_1.default.join(dir, tmpName);
            await (0, types_1.sftpWriteFile)(session.sftp, tmpPath, buf);
            await (0, types_1.sftpRename)(session.sftp, tmpPath, file.path);
        }
        this.addStep(ctx, "save_files", "saving", true, `Saved ${ctx.files.length} file(s)`);
    }
    async stepValidate(ctx) {
        this.transitionState(ctx, "validating", "validate");
        const hooks = ctx.config.deploy.preValidate;
        if (hooks.length === 0) {
            this.addStep(ctx, "validate", "validating", true, "No validators configured");
            return;
        }
        // Run built-in validators referenced by ID
        for (const validatorId of hooks) {
            // Check if it's a known command template (e.g., "nginx-test")
            const template = commandRunner_1.commandRunner.getTemplate(`${validatorId}-test`) ||
                commandRunner_1.commandRunner.getTemplate(validatorId);
            if (template) {
                const result = await commandRunner_1.commandRunner.runTemplate(ctx.sessionId, template.id, {});
                if (result.exitCode !== 0) {
                    this.addStep(ctx, "validate", "validating", false, undefined, `Validation failed (${template.name}):\n${result.stderr || result.stdout}`);
                    this.transitionState(ctx, "failed", "validate");
                    return;
                }
            }
            else {
                // Treat as custom command
                const result = await sshExecutor_1.sshExecutor.exec({
                    sessionId: ctx.sessionId,
                    command: validatorId,
                    timeout: 15_000,
                });
                if (result.exitCode !== 0) {
                    this.addStep(ctx, "validate", "validating", false, undefined, `Validation failed:\n${result.stderr || result.stdout}`);
                    this.transitionState(ctx, "failed", "validate");
                    return;
                }
            }
        }
        this.addStep(ctx, "validate", "validating", true, `Passed ${hooks.length} validation(s)`);
    }
    async stepBackup(ctx) {
        this.transitionState(ctx, "backing_up", "backup");
        for (const file of ctx.files) {
            try {
                const backup = await backupManager_1.backupManager.createBackup(ctx.sessionId, file.path);
                if (backup) {
                    ctx.backupPaths.set(file.path, backup.path);
                }
            }
            catch (err) {
                // Non-fatal: log but continue
                console.warn(`[deploy] Backup warning for ${file.path}: ${err.message}`);
            }
        }
        this.addStep(ctx, "backup", "backing_up", true, `Created ${ctx.backupPaths.size} backup(s)`);
    }
    async stepDeploy(ctx) {
        this.transitionState(ctx, "deploying", "deploy_service");
        // Pre-deploy hooks
        for (const hook of ctx.config.deploy.preDeployHooks) {
            const result = await sshExecutor_1.sshExecutor.exec({
                sessionId: ctx.sessionId,
                command: hook,
                timeout: 60_000,
            });
            if (result.exitCode !== 0) {
                this.addStep(ctx, "deploy_service", "deploying", false, undefined, `Pre-deploy hook failed: ${hook}\n${result.stderr}`);
                this.transitionState(ctx, "failed", "deploy_service");
                return;
            }
        }
        // Restart primary service
        const primaryService = ctx.config.services[0];
        if (primaryService) {
            // Validate unit name before interpolating into shell command.
            // Only allow safe systemd unit name characters: letters, digits, ., _, @, -, and .service suffix.
            const SAFE_UNIT_RE = /^[a-zA-Z0-9._@\-]+(?:\.service|\.socket|\.timer|\.target)?$/;
            if (primaryService.unit && !SAFE_UNIT_RE.test(primaryService.unit)) {
                this.addStep(ctx, "deploy_service", "deploying", false, undefined, `Invalid service unit name: "${primaryService.unit}"`);
                this.transitionState(ctx, "failed", "deploy_service");
                return;
            }
            const restartCmd = primaryService.restartCommand ||
                `systemctl restart ${primaryService.unit}`;
            const result = await sshExecutor_1.sshExecutor.exec({
                sessionId: ctx.sessionId,
                command: restartCmd,
                sudo: true,
                timeout: 30_000,
            });
            if (result.exitCode !== 0) {
                this.addStep(ctx, "deploy_service", "deploying", false, undefined, `Service restart failed:\n${result.stderr}`);
                this.transitionState(ctx, "failed", "deploy_service");
                return;
            }
        }
        // Post-deploy hooks
        for (const hook of ctx.config.deploy.postDeployHooks) {
            const result = await sshExecutor_1.sshExecutor.exec({
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
    async stepCheckStatus(ctx) {
        this.transitionState(ctx, "checking_status", "check_status");
        const primaryService = ctx.config.services[0];
        if (!primaryService) {
            this.addStep(ctx, "check_status", "checking_status", true, "No service configured — skipping status check");
            return;
        }
        // Wait a moment for the service to stabilize
        await sleep(2000);
        const SAFE_UNIT_RE = /^[a-zA-Z0-9._@\-]+(?:\.service|\.socket|\.timer|\.target)?$/;
        if (primaryService.unit && !SAFE_UNIT_RE.test(primaryService.unit)) {
            this.addStep(ctx, "check_status", "checking_status", false, undefined, `Invalid service unit name: "${primaryService.unit}"`);
            this.transitionState(ctx, "failed", "check_status");
            return;
        }
        const statusCmd = primaryService.statusCommand ||
            `systemctl is-active ${primaryService.unit}`;
        const result = await sshExecutor_1.sshExecutor.exec({
            sessionId: ctx.sessionId,
            command: statusCmd,
            timeout: 10_000,
        });
        const isActive = result.exitCode === 0 &&
            (result.stdout.trim() === "active" ||
                result.stdout.includes("active (running)") ||
                result.exitCode === 0);
        if (!isActive) {
            this.addStep(ctx, "check_status", "checking_status", false, undefined, `Service is not healthy:\n${result.stdout}\n${result.stderr}`);
            this.transitionState(ctx, "failed", "check_status");
            // Auto-fetch logs on failure
            await this.stepFetchLogs(ctx);
            return;
        }
        this.addStep(ctx, "check_status", "checking_status", true, `Service is active`);
    }
    async stepFetchLogs(ctx) {
        this.transitionState(ctx, "fetching_logs", "fetch_logs");
        const primaryService = ctx.config.services[0];
        if (!primaryService)
            return;
        try {
            ctx.logs = await logStreamer_1.logStreamer.fetchLogs(ctx.sessionId, primaryService.unit, 50);
            this.addStep(ctx, "fetch_logs", "fetching_logs", true, `Fetched ${ctx.logs.length} log entries`);
        }
        catch (err) {
            this.addStep(ctx, "fetch_logs", "fetching_logs", false, undefined, err.message);
        }
        // Return to failed state after fetching logs
        ctx.state = "failed";
        ctx.onStateChange?.(this.toStatus(ctx));
    }
    isFailed(ctx) {
        return ctx.state === "failed";
    }
    // ─── Helpers ──────────────────────────────────────────────────
    transitionState(ctx, state, step) {
        ctx.state = state;
        ctx.currentStep = step;
        if (state === "completed" || state === "failed") {
            ctx.completedAt = Date.now();
        }
        ctx.onStateChange?.(this.toStatus(ctx));
    }
    addStep(ctx, step, state, success, output, error) {
        ctx.steps.push({
            step,
            state,
            success,
            output,
            error,
            durationMs: Date.now() - ctx.startedAt,
        });
    }
    toStatus(ctx) {
        return {
            deployId: ctx.deployId,
            state: ctx.state,
            currentStep: ctx.currentStep,
            steps: [...ctx.steps],
            startedAt: ctx.startedAt,
            completedAt: ctx.completedAt,
        };
    }
}
exports.DeploymentEngine = DeploymentEngine;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.deploymentEngine = new DeploymentEngine();
//# sourceMappingURL=deploymentEngine.js.map