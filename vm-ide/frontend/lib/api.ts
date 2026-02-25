const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ─── Token management ────────────────────────────────────────────
const TOKEN_KEY = "vm-ide-token";

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size: number;
  modifiedAt: number;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 402 && data.upgradeUrl) {
      throw new Error("Pro subscription required");
    }
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

export async function connectSession(params: {
  host: string;
  port: number;
  username: string;
  authMethod: "password" | "key";
  password?: string;
  privateKey?: string;
}): Promise<{ sessionId: string; token: string }> {
  const res = await request<{ sessionId: string; token: string }>("/api/session/connect", {
    method: "POST",
    body: JSON.stringify(params),
  });
  // Store the JWT token for subsequent authenticated requests
  if (res.token) {
    setAuthToken(res.token);
  }
  return res;
}

export async function disconnectSession(sessionId: string): Promise<void> {
  const result = request<void>("/api/session/disconnect", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });
  clearAuthToken();
  return result;
}

export async function listDir(
  sessionId: string,
  path: string
): Promise<{ path: string; entries: FileEntry[] }> {
  return request(`/api/fs/list?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(path)}`);
}

export async function readFile(
  sessionId: string,
  path: string
): Promise<{ path: string; content: string; size: number }> {
  return request(`/api/fs/read?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(path)}`);
}

export async function writeFile(
  sessionId: string,
  path: string,
  content: string,
  options?: { safeWrite?: boolean; createBackup?: boolean }
): Promise<{
  ok: boolean;
  path: string;
  size: number;
  backupPath?: string;
  previousSize?: number;
}> {
  return request("/api/fs/write", {
    method: "POST",
    body: JSON.stringify({
      sessionId,
      path,
      content,
      safeWrite: options?.safeWrite ?? true,
      createBackup: options?.createBackup ?? true,
    }),
  });
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

export async function diffFile(
  sessionId: string,
  path: string,
  newContent: string
): Promise<DiffResult> {
  return request("/api/fs/diff", {
    method: "POST",
    body: JSON.stringify({ sessionId, path, newContent }),
  });
}

export interface BackupEntry {
  path: string;
  originalPath: string;
  timestamp: number;
  size: number;
}

export async function listBackups(
  sessionId: string,
  path: string
): Promise<{ path: string; backups: BackupEntry[] }> {
  return request(
    `/api/fs/backups?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(path)}`
  );
}

export async function restoreBackup(
  sessionId: string,
  backupPath: string,
  targetPath: string
): Promise<{ ok: boolean }> {
  return request("/api/fs/restore", {
    method: "POST",
    body: JSON.stringify({ sessionId, backupPath, targetPath }),
  });
}

export async function mkdir(
  sessionId: string,
  path: string
): Promise<{ ok: boolean }> {
  return request("/api/fs/mkdir", {
    method: "POST",
    body: JSON.stringify({ sessionId, path }),
  });
}

export async function renameItem(
  sessionId: string,
  oldPath: string,
  newPath: string
): Promise<{ ok: boolean }> {
  return request("/api/fs/rename", {
    method: "POST",
    body: JSON.stringify({ sessionId, oldPath, newPath }),
  });
}

export async function deleteItem(
  sessionId: string,
  path: string,
  recursive: boolean = false
): Promise<{ ok: boolean }> {
  return request("/api/fs/delete", {
    method: "POST",
    body: JSON.stringify({ sessionId, path, recursive }),
  });
}

export function getTerminalWsUrl(sessionId: string): string {
  const wsBase = API_BASE.replace(/^http/, "ws");
  return `${wsBase}/ws/terminal?sessionId=${encodeURIComponent(sessionId)}`;
}

export function getSessionWsUrl(sessionId: string): string {
  const wsBase = API_BASE.replace(/^http/, "ws");
  return `${wsBase}/ws/session?sessionId=${encodeURIComponent(sessionId)}`;
}

// ─── Commands ────────────────────────────────────────────────────

export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  command: string;
  parameters: Array<{
    name: string;
    type: "string" | "number";
    required: boolean;
    default?: string | number;
  }>;
  requiresSudo: boolean;
  timeout: number;
  dangerLevel: "safe" | "moderate" | "dangerous";
}

export interface CommandResult {
  templateId?: string;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export async function getCommandTemplates(
  sessionId: string
): Promise<{ templates: CommandTemplate[] }> {
  return request(
    `/api/commands/templates?sessionId=${encodeURIComponent(sessionId)}`
  );
}

export async function runCommand(
  sessionId: string,
  templateId: string,
  params: Record<string, string | number> = {}
): Promise<CommandResult> {
  return request("/api/commands/run", {
    method: "POST",
    body: JSON.stringify({ sessionId, templateId, params }),
  });
}

export async function runCustomCommand(
  sessionId: string,
  command: string,
  sudo: boolean = false
): Promise<CommandResult> {
  return request("/api/commands/custom", {
    method: "POST",
    body: JSON.stringify({ sessionId, command, confirmed: true, sudo }),
  });
}

// ─── Deploy ──────────────────────────────────────────────────────

export type DeployState =
  | "idle"
  | "saving"
  | "validating"
  | "backing_up"
  | "deploying"
  | "checking_status"
  | "fetching_logs"
  | "completed"
  | "rolling_back"
  | "failed";

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

export async function startDeploy(
  sessionId: string,
  files: Array<{ path: string; content: string }> = []
): Promise<DeployStatus> {
  return request("/api/deploy/start", {
    method: "POST",
    body: JSON.stringify({ sessionId, files }),
  });
}

export async function getDeployStatus(
  deployId: string
): Promise<DeployStatus> {
  return request(`/api/deploy/status?deployId=${encodeURIComponent(deployId)}`);
}

export async function cancelDeploy(
  deployId: string
): Promise<{ ok: boolean }> {
  return request("/api/deploy/cancel", {
    method: "POST",
    body: JSON.stringify({ deployId }),
  });
}

export async function rollbackDeploy(
  deployId: string
): Promise<{ ok: boolean }> {
  return request("/api/deploy/rollback", {
    method: "POST",
    body: JSON.stringify({ deployId }),
  });
}

export interface LogEntry {
  timestamp: string;
  unit: string;
  message: string;
  priority: string;
}

export async function fetchDeployLogs(
  sessionId: string,
  service: string,
  lines: number = 50
): Promise<{ service: string; entries: LogEntry[] }> {
  return request(
    `/api/deploy/logs?sessionId=${encodeURIComponent(sessionId)}&service=${encodeURIComponent(service)}&lines=${lines}`
  );
}

// ─── Config ──────────────────────────────────────────────────────

export interface ProjectConfig {
  version: number;
  project: {
    name: string;
    rootPath: string;
    type: string;
  };
  services: Array<{
    name: string;
    unit: string;
    type: string;
    restartCommand?: string;
    statusCommand?: string;
    logCommand?: string;
  }>;
  deploy: {
    files: string[];
    preValidate: string[];
    preDeployHooks: string[];
    postDeployHooks: string[];
    autoRollbackOnFailure: boolean;
  };
  commands: Array<{
    name: string;
    command: string;
    icon?: string;
    dangerLevel: string;
    requiresConfirmation: boolean;
  }>;
}

// ─── AI ─────────────────────────────────────────────────────────

export interface AIExplanation {
  summary: string;
  risks: string[];
  misconfigurations: string[];
  optimizations: string[];
  lineNotes: Array<{ line: number; note: string }>;
}

export interface AIAnalysis {
  rootCause: string;
  explanation: string;
  suggestedFixes: string[];
  severity: "low" | "medium" | "high" | "critical";
}

export interface ValidationReport {
  filePath: string;
  results: Array<{
    validatorId: string;
    validatorName: string;
    result: { valid: boolean; errors: string[] };
    durationMs: number;
  }>;
  overallValid: boolean;
  aiExplanation?: { explanation: string; suggestions: string[] };
}

export async function explainFile(
  sessionId: string,
  filePath: string,
  content?: string
): Promise<AIExplanation> {
  return request("/api/ai/explain", {
    method: "POST",
    body: JSON.stringify({ sessionId, filePath, content }),
  });
}

export async function diagnoseFailure(
  sessionId: string,
  service: string,
  logs: string,
  configPath?: string
): Promise<AIAnalysis> {
  return request("/api/ai/diagnose", {
    method: "POST",
    body: JSON.stringify({ sessionId, service, logs, configPath }),
  });
}

export async function validateFile(
  sessionId: string,
  filePath: string,
  aiExplain: boolean = false
): Promise<ValidationReport> {
  return request("/api/ai/validate", {
    method: "POST",
    body: JSON.stringify({ sessionId, filePath, aiExplain }),
  });
}

export async function getProjectConfig(
  sessionId: string,
  rootPath?: string
): Promise<ProjectConfig> {
  const params = new URLSearchParams({ sessionId });
  if (rootPath) params.set("rootPath", rootPath);
  return request(`/api/config?${params.toString()}`);
}

// ─── Billing ─────────────────────────────────────────────

export async function createCheckoutSession(): Promise<{ url: string }> {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create checkout session");
  return data;
}

export async function createPortalSession(): Promise<{ url: string }> {
  const res = await fetch("/api/billing/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create portal session");
  return data;
}

// ─── Agent Developer Mode ────────────────────────────────────────

export interface AgentContext {
  currentFile?: string;
  selection?: string;
  folderPath?: string;
  wholeRepo?: boolean;
  workspaceRoot: string;
}

export interface AgentOptions {
  autoRunCommands: boolean;
  autoFixFailures: boolean;
  autoInstallDeps: boolean;
  isPro?: boolean;
}

export interface AgentFileChange {
  path: string;
  action: "created" | "modified" | "deleted" | "renamed";
}

export type AgentState =
  | "idle"
  | "planning"
  | "running"
  | "awaiting_permission"
  | "paused"
  | "done"
  | "failed"
  | "stopped"
  | "rolling_back";

export interface AgentSession {
  id: string;
  state: AgentState;
  pendingPermission?: {
    tool: string;
    args: Record<string, any>;
    reason: string;
    decision?: "granted" | "denied";
  };
}

export async function agentPlanOnly(
  sessionId: string,
  prompt: string,
  context: AgentContext
): Promise<{ plan: string }> {
  return request("/api/agent/plan", {
    method: "POST",
    body: JSON.stringify({ sessionId, prompt, context }),
  });
}

export async function agentStop(
  agentSessionId: string
): Promise<{ ok: boolean }> {
  return request("/api/agent/stop", {
    method: "POST",
    body: JSON.stringify({ agentSessionId }),
  });
}

export async function agentRollback(
  agentSessionId: string
): Promise<{ ok: boolean; restoredFiles: string[] }> {
  return request("/api/agent/rollback", {
    method: "POST",
    body: JSON.stringify({ agentSessionId }),
  });
}

export async function agentStatus(
  agentSessionId: string
): Promise<{
  id: string;
  state: AgentState;
  plan?: string;
  fileChanges: AgentFileChange[];
  summary?: string;
  error?: string;
  toolCallCount: number;
}> {
  return request(`/api/agent/status?agentSessionId=${encodeURIComponent(agentSessionId)}`);
}

export async function getAgentHistory(sshSessionId: string): Promise<any[]> {
  const data = await request(`/api/agent/history?sshSessionId=${encodeURIComponent(sshSessionId)}`) as any;
  return data.history || [];
}

export async function deleteAgentSession(sessionId: string, sshSessionId: string): Promise<void> {
  return request(`/api/agent/session?sessionId=${encodeURIComponent(sessionId)}&sshSessionId=${encodeURIComponent(sshSessionId)}`, {
    method: "DELETE",
  });
}

