import path from "path";
import { getSession } from "../sessionStore";
import { sshExecutor } from "./sshExecutor";
import { backupManager } from "./backupManager";
import {
    AgentFileChange,
    sftpStat,
    sftpReadFile,
    sftpWriteFile,
    sftpMkdir,
    sftpUnlink,
    sftpRename,
    sftpReaddir,
} from "../types";

// ─── Safety Constants ────────────────────────────────────────────

const MAX_FILE_SIZE = 512 * 1024; // 512KB
const MAX_FILES_PER_SESSION = 30;
const CMD_TIMEOUT = 60_000;
const SEARCH_TIMEOUT = 10_000;

// Commands allowed for agent use — safe build/test/lint tools only
const ALLOWED_COMMANDS = new Set([
    "npm", "npx", "yarn", "pnpm",
    "pip", "pip3", "python", "python3",
    "go", "cargo", "make", "cmake",
    "cat", "head", "tail", "wc",
    "grep", "find", "ls", "pwd", "which", "echo",
    "test", "jest", "pytest", "mocha", "vitest",
    "tsc", "node",
    "eslint", "prettier", "biome",
    "git",
    "mkdir", "touch", "cp",
]);

// Patterns that should never be executed
const BLOCKED_PATTERNS = [
    /rm\s+(-rf|-fr|--no-preserve-root)/,
    /mkfs\b/,
    /:\(\)\{\s*:|:\s*&\s*\}\s*;/,
    /dd\s+if=/,
    />(\/dev\/[sh]d|\/dev\/null)/,
    /chmod\s+(-R\s+)?777\s+\//,
    /shutdown\b|reboot\b|halt\b|poweroff\b/,
    /curl\s.*\|\s*(sh|bash)/,
    /wget\s.*\|\s*(sh|bash)/,
    /eval\s/,
];

const SHELL_METACHAR_RE = /[`$(){}|;&<>!\\]/;

// ─── Path Validation ─────────────────────────────────────────────

export function validateAgentPath(
    filePath: string,
    workspaceRoot: string,
    allowSystemAccess: boolean = false
): string | null {
    if (!filePath || typeof filePath !== "string") {
        return "Path is required";
    }
    if (filePath.includes("\0")) {
        return "Path contains null bytes";
    }
    if (!path.isAbsolute(filePath)) {
        return "Path must be absolute";
    }
    const normalized = path.normalize(filePath);
    if (!allowSystemAccess && !normalized.startsWith(workspaceRoot)) {
        return `Path must be under workspace root: ${workspaceRoot} (System access required)`;
    }
    if (normalized.includes("/../") || normalized.endsWith("/..")) {
        return "Path traversal not allowed";
    }
    return null;
}

// ─── Command Validation ──────────────────────────────────────────

export function validateCommand(
    command: string,
    allowSystemAccess: boolean = false
): string | null {
    if (!command || typeof command !== "string") {
        return "Command is required";
    }
    if (command.length > 4096) {
        return "Command too long (max 4096 chars)";
    }

    const baseCmd = command.trim().split(/\s+/)[0];
    const cmdName = path.basename(baseCmd);

    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(command)) {
            return "Command matches a blocked dangerous pattern";
        }
    }

    if (!allowSystemAccess && !ALLOWED_COMMANDS.has(cmdName)) {
        return `Command '${cmdName}' is not in the allowed list and requires system access permission.`;
    }

    return null;
}

// ─── Permission Checker ──────────────────────────────────────────

export function checkToolPermission(
    toolName: string,
    args: Record<string, any>,
    workspaceRoot: string,
    autoRunCommands: boolean
): { requiresPermission: boolean; reason?: string } {
    if (toolName === "run_cmd") {
        if (!autoRunCommands) {
            return { requiresPermission: true, reason: "Auto-run commands is disabled" };
        }
        const err = validateCommand(args.command, false);
        if (err && err.includes("requires system access permission")) {
            return { requiresPermission: true, reason: `System command: ${args.command}` };
        }
    }

    const pathsToCheck: string[] = [];
    if (args.path) pathsToCheck.push(args.path);
    if (args.cwd) pathsToCheck.push(args.cwd);
    if (args.oldPath) pathsToCheck.push(args.oldPath);
    if (args.newPath) pathsToCheck.push(args.newPath);

    for (const p of pathsToCheck) {
        const err = validateAgentPath(p, workspaceRoot, false);
        if (err && err.includes("System access required")) {
            return { requiresPermission: true, reason: `Accesses path outside workspace: ${p}` };
        }
    }

    return { requiresPermission: false };
}

// ─── Secrets Redaction ───────────────────────────────────────────

const SECRET_PATTERNS = [
    /(?:KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL|API_KEY|ACCESS_KEY|PRIVATE)[=:\s]+\S+/gi,
    /-----BEGIN[\s\S]*?-----END[^\n]+/g,
    /(?:[A-Za-z0-9+/]{40,})={0,2}/g,
];

export function redactSecrets(content: string): string {
    let redacted = content;
    for (const pattern of SECRET_PATTERNS) {
        redacted = redacted.replace(pattern, "[REDACTED]");
    }
    return redacted;
}

// ─── Tool Implementations ────────────────────────────────────────

export class AgentTools {
    private fileChanges: AgentFileChange[] = [];
    private snapshotsDone = new Set<string>();

    constructor(
        private sshSessionId: string,
        private workspaceRoot: string
    ) { }

    getFileChanges(): AgentFileChange[] {
        return [...this.fileChanges];
    }

    // ─── list_dir ──────────────────────────────────────────────────

    async listDir(dirPath: string, options?: { allowSystemAccess?: boolean }): Promise<{ entries: Array<{ name: string; type: string; size: number }> }> {
        const err = validateAgentPath(dirPath, this.workspaceRoot, options?.allowSystemAccess);
        if (err) throw new Error(err);

        const session = getSession(this.sshSessionId);
        if (!session) throw new Error("SSH session not found");

        const rawEntries = await sftpReaddir(session.sftp, dirPath);

        const entries = rawEntries
            .filter((e) => !e.filename.startsWith("."))
            .map((e) => ({
                name: e.filename,
                type: e.attrs.isDirectory() ? "directory" : "file",
                size: e.attrs.size,
            }))
            .sort((a, b) => {
                if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
                return a.name.localeCompare(b.name);
            });

        return { entries };
    }

    // ─── read_file ─────────────────────────────────────────────────

    async readFile(filePath: string, options?: { allowSystemAccess?: boolean }): Promise<{ content: string; size: number }> {
        const err = validateAgentPath(filePath, this.workspaceRoot, options?.allowSystemAccess);
        if (err) throw new Error(err);

        const session = getSession(this.sshSessionId);
        if (!session) throw new Error("SSH session not found");

        const stats = await sftpStat(session.sftp, filePath);
        if (stats.size > MAX_FILE_SIZE) {
            throw new Error(`File too large (${stats.size} bytes, max ${MAX_FILE_SIZE})`);
        }

        const buf = await sftpReadFile(session.sftp, filePath);
        return { content: buf.toString("utf-8"), size: stats.size };
    }

    // ─── write_file (create or overwrite) ──────────────────────────

    async writeFile(filePath: string, content: string, options?: { allowSystemAccess?: boolean }): Promise<{ ok: boolean; size: number }> {
        const err = validateAgentPath(filePath, this.workspaceRoot, options?.allowSystemAccess);
        if (err) throw new Error(err);

        if (this.fileChanges.length >= MAX_FILES_PER_SESSION) {
            throw new Error(`Max file changes per session exceeded (${MAX_FILES_PER_SESSION})`);
        }

        const session = getSession(this.sshSessionId);
        if (!session) throw new Error("SSH session not found");

        const buf = Buffer.from(content, "utf-8");
        if (buf.length > MAX_FILE_SIZE) {
            throw new Error(`Content too large (${buf.length} bytes, max ${MAX_FILE_SIZE})`);
        }

        // Snapshot existing file before first modification
        let fileExists = false;
        try {
            await sftpStat(session.sftp, filePath);
            fileExists = true;
        } catch {
            // File doesn't exist — new file
        }

        let snapshotPath: string | undefined;
        if (fileExists && !this.snapshotsDone.has(filePath)) {
            try {
                const backup = await backupManager.createBackup(this.sshSessionId, filePath);
                snapshotPath = backup?.path;
                this.snapshotsDone.add(filePath);
            } catch (backupErr: any) {
                console.warn(`[agent] Backup failed for ${filePath}: ${backupErr.message}`);
            }
        }

        // Atomic write: temp file then rename
        const dir = path.dirname(filePath);
        const tmpName = `.vmide-agent-tmp.${Date.now()}`;
        const tmpPath = path.join(dir, tmpName);

        await sftpWriteFile(session.sftp, tmpPath, buf);
        await sftpRename(session.sftp, tmpPath, filePath);

        this.fileChanges.push({
            path: filePath,
            action: fileExists ? "modified" : "created",
            snapshotPath,
        });

        return { ok: true, size: buf.length };
    }

    // ─── create_file ───────────────────────────────────────────────

    async createFile(filePath: string, content: string, options?: { allowSystemAccess?: boolean }): Promise<{ ok: boolean }> {
        const err = validateAgentPath(filePath, this.workspaceRoot, options?.allowSystemAccess);
        if (err) throw new Error(err);

        const session = getSession(this.sshSessionId);
        if (!session) throw new Error("SSH session not found");

        // Check file doesn't already exist
        try {
            await sftpStat(session.sftp, filePath);
            throw new Error(`File already exists: ${filePath}`);
        } catch (e: any) {
            if (e.message.includes("already exists")) throw e;
            // File doesn't exist — good
        }

        // Ensure parent directory exists
        const dir = path.dirname(filePath);
        try {
            await sftpStat(session.sftp, dir);
        } catch {
            await sftpMkdir(session.sftp, dir);
        }

        return this.writeFile(filePath, content, options);
    }

    // ─── delete_file ───────────────────────────────────────────────

    async deleteFile(filePath: string, options?: { allowSystemAccess?: boolean }): Promise<{ ok: boolean }> {
        const err = validateAgentPath(filePath, this.workspaceRoot, options?.allowSystemAccess);
        if (err) throw new Error(err);

        const session = getSession(this.sshSessionId);
        if (!session) throw new Error("SSH session not found");

        // Snapshot before deleting
        if (!this.snapshotsDone.has(filePath)) {
            try {
                await backupManager.createBackup(this.sshSessionId, filePath);
                this.snapshotsDone.add(filePath);
            } catch {
                // Non-fatal
            }
        }

        await sftpUnlink(session.sftp, filePath);

        this.fileChanges.push({ path: filePath, action: "deleted" });
        return { ok: true };
    }

    // ─── rename_file ───────────────────────────────────────────────

    async renameFile(oldPath: string, newPath: string, options?: { allowSystemAccess?: boolean }): Promise<{ ok: boolean }> {
        const errOld = validateAgentPath(oldPath, this.workspaceRoot, options?.allowSystemAccess);
        if (errOld) throw new Error(errOld);
        const errNew = validateAgentPath(newPath, this.workspaceRoot, options?.allowSystemAccess);
        if (errNew) throw new Error(errNew);

        const session = getSession(this.sshSessionId);
        if (!session) throw new Error("SSH session not found");

        // Snapshot the old file
        if (!this.snapshotsDone.has(oldPath)) {
            try {
                await backupManager.createBackup(this.sshSessionId, oldPath);
                this.snapshotsDone.add(oldPath);
            } catch {
                // Non-fatal
            }
        }

        await sftpRename(session.sftp, oldPath, newPath);

        this.fileChanges.push({ path: oldPath, action: "renamed" });
        return { ok: true };
    }

    // ─── search_files ──────────────────────────────────────────────

    async searchFiles(query: string, searchPath?: string, options?: { allowSystemAccess?: boolean }): Promise<{ matches: string[] }> {
        const targetPath = searchPath || this.workspaceRoot;
        const err = validateAgentPath(targetPath, this.workspaceRoot, options?.allowSystemAccess);
        if (err) throw new Error(err);

        // Sanitize query — no shell metacharacters
        if (SHELL_METACHAR_RE.test(query)) {
            throw new Error("Search query contains disallowed characters");
        }

        const result = await sshExecutor.exec({
            sessionId: this.sshSessionId,
            command: `grep -rn --include='*' -l '${query.replace(/'/g, "'\\''")}' '${targetPath}' 2>/dev/null | head -20`,
            timeout: SEARCH_TIMEOUT,
        });

        const matches = result.stdout
            .split("\n")
            .filter((l) => l.trim().length > 0);

        return { matches };
    }

    // ─── run_cmd ───────────────────────────────────────────────────

    async runCmd(
        command: string,
        cwd?: string,
        options?: { allowSystemAccess?: boolean }
    ): Promise<{ exitCode: number; stdout: string; stderr: string; durationMs: number }> {
        const cmdErr = validateCommand(command, options?.allowSystemAccess);
        if (cmdErr) throw new Error(cmdErr);

        if (cwd) {
            const pathErr = validateAgentPath(cwd, this.workspaceRoot, options?.allowSystemAccess);
            if (pathErr) throw new Error(pathErr);
        }

        const fullCmd = cwd ? `cd '${cwd}' && ${command}` : command;

        const result = await sshExecutor.exec({
            sessionId: this.sshSessionId,
            command: fullCmd,
            timeout: CMD_TIMEOUT,
        });

        return {
            exitCode: result.exitCode,
            stdout: result.stdout.slice(0, 50_000), // Cap output
            stderr: result.stderr.slice(0, 20_000),
            durationMs: result.durationMs,
        };
    }

    // ─── Rollback all changes ──────────────────────────────────────

    async rollbackAll(): Promise<{ restoredFiles: string[] }> {
        const restoredFiles: string[] = [];

        for (const change of this.fileChanges) {
            try {
                if (change.action === "created") {
                    // Delete files the agent created
                    const session = getSession(this.sshSessionId);
                    if (session) {
                        await sftpUnlink(session.sftp, change.path);
                        restoredFiles.push(change.path);
                    }
                } else if (change.snapshotPath) {
                    // Restore from backup
                    await backupManager.restoreBackup(
                        this.sshSessionId,
                        change.snapshotPath,
                        change.path
                    );
                    restoredFiles.push(change.path);
                }
            } catch (err: any) {
                console.error(`[agent] Rollback failed for ${change.path}: ${err.message}`);
            }
        }

        return { restoredFiles };
    }
}
