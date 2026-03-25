import { SFTPWrapper } from "ssh2";
export interface ExecOptions {
    sessionId: string;
    command: string;
    timeout?: number;
    sudo?: boolean;
    env?: Record<string, string>;
    stdin?: string;
}
export interface ExecResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    timedOut: boolean;
    durationMs: number;
}
export interface BackupEntry {
    path: string;
    originalPath: string;
    timestamp: number;
    size: number;
}
export interface SafeWriteResult {
    ok: boolean;
    path: string;
    size: number;
    backupPath?: string;
    previousSize?: number;
}
export interface DiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
}
export interface DiffResult {
    hunks: DiffHunk[];
    additions: number;
    deletions: number;
}
export type DangerLevel = "safe" | "moderate" | "dangerous";
export type CommandCategory = "systemd" | "nginx" | "node" | "docker" | "custom";
export interface ParameterDef {
    name: string;
    type: "string" | "number";
    required: boolean;
    default?: string | number;
}
export interface CommandTemplate {
    id: string;
    name: string;
    description: string;
    category: CommandCategory;
    command: string;
    parameters: ParameterDef[];
    requiresSudo: boolean;
    timeout: number;
    dangerLevel: DangerLevel;
}
export interface CommandResult {
    templateId?: string;
    command: string;
    exitCode: number;
    stdout: string;
    stderr: string;
    durationMs: number;
}
export type DeployState = "idle" | "saving" | "validating" | "backing_up" | "deploying" | "checking_status" | "fetching_logs" | "completed" | "rolling_back" | "failed";
export interface DeployStepResult {
    step: string;
    state: DeployState;
    success: boolean;
    output?: string;
    error?: string;
    durationMs: number;
}
export interface DeployStatus {
    deployId: string;
    state: DeployState;
    currentStep: string;
    steps: DeployStepResult[];
    startedAt: number;
    completedAt?: number;
}
export type LogPriority = "emerg" | "alert" | "crit" | "err" | "warning" | "notice" | "info" | "debug";
export interface LogEntry {
    timestamp: string;
    unit: string;
    message: string;
    priority: LogPriority;
}
export interface ServiceConfig {
    name: string;
    unit: string;
    type: "systemd" | "pm2" | "docker" | "custom";
    restartCommand?: string;
    statusCommand?: string;
    logCommand?: string;
}
export interface CustomCommand {
    name: string;
    command: string;
    icon?: string;
    dangerLevel: DangerLevel;
    requiresConfirmation: boolean;
}
export interface DeployConfig {
    files: string[];
    preValidate: string[];
    preDeployHooks: string[];
    postDeployHooks: string[];
    autoRollbackOnFailure: boolean;
}
export interface ProjectConfig {
    version: 1;
    project: {
        name: string;
        rootPath: string;
        type: "node" | "python" | "nginx" | "generic";
    };
    services: ServiceConfig[];
    deploy: DeployConfig;
    commands: CustomCommand[];
}
export type WSChannel = "terminal" | "logs" | "deploy" | "exec" | "agent" | "system";
export interface WSMessage {
    channel: WSChannel;
    type: string;
    payload: any;
}
export type AgentState = "idle" | "planning" | "running" | "awaiting_permission" | "paused" | "done" | "failed" | "stopped" | "rolling_back";
export interface AgentContext {
    currentFile?: string;
    selection?: string;
    folderPath?: string;
    wholeRepo?: boolean;
    workspaceRoot: string;
}
export interface AgentStep {
    id: string;
    label: string;
    state: "pending" | "running" | "done" | "failed" | "skipped";
    output?: string;
    error?: string;
    durationMs?: number;
    startedAt?: number;
}
export interface AgentToolCall {
    id: string;
    tool: string;
    args: Record<string, any>;
    result?: any;
    error?: string;
    durationMs?: number;
}
export interface AgentFileChange {
    path: string;
    action: "created" | "modified" | "deleted" | "renamed";
    snapshotPath?: string;
}
export interface AgentSession {
    id: string;
    sshSessionId: string;
    state: AgentState;
    prompt: string;
    context: AgentContext;
    plan?: string;
    steps: AgentStep[];
    toolCalls: AgentToolCall[];
    fileChanges: AgentFileChange[];
    options: AgentOptions;
    startedAt: number;
    completedAt?: number;
    summary?: string;
    error?: string;
    retryCount: number;
    maxRetries: number;
    pendingPermission?: {
        tool: string;
        args: Record<string, any>;
        reason: string;
        decision?: "granted" | "denied";
    };
}
export interface AgentOptions {
    autoRunCommands: boolean;
    autoFixFailures: boolean;
    autoInstallDeps: boolean;
    isPro?: boolean;
}
export interface AgentEvent {
    sessionId: string;
    type: string;
    data: any;
    timestamp: number;
}
export interface AIExplanation {
    summary: string;
    risks: string[];
    misconfigurations: string[];
    optimizations: string[];
    lineNotes: Array<{
        line: number;
        note: string;
    }>;
}
export interface AIAnalysis {
    rootCause: string;
    explanation: string;
    suggestedFixes: string[];
    severity: "low" | "medium" | "high" | "critical";
}
export interface AIValidation {
    valid: boolean;
    errors: string[];
    aiExplanation?: string;
    suggestions: string[];
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export interface ValidationReport {
    filePath: string;
    results: Array<{
        validatorId: string;
        validatorName: string;
        result: ValidationResult;
        durationMs: number;
    }>;
    overallValid: boolean;
}
export declare function sftpStat(sftp: SFTPWrapper, path: string): Promise<{
    size: number;
    mtime: number;
    isDirectory: boolean;
}>;
export declare function sftpMkdir(sftp: SFTPWrapper, path: string): Promise<void>;
export declare function sftpReadFile(sftp: SFTPWrapper, path: string): Promise<Buffer>;
export declare function sftpWriteFile(sftp: SFTPWrapper, path: string, data: Buffer): Promise<void>;
export declare function sftpRename(sftp: SFTPWrapper, oldPath: string, newPath: string): Promise<void>;
export declare function sftpUnlink(sftp: SFTPWrapper, path: string): Promise<void>;
export declare function sftpReaddir(sftp: SFTPWrapper, path: string): Promise<Array<{
    filename: string;
    attrs: {
        size: number;
        mtime: number;
        isDirectory: () => boolean;
    };
}>>;
//# sourceMappingURL=index.d.ts.map