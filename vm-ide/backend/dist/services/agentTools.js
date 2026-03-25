"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentTools = void 0;
exports.validateAgentPath = validateAgentPath;
exports.validateCommand = validateCommand;
exports.checkToolPermission = checkToolPermission;
exports.redactSecrets = redactSecrets;
const path_1 = __importDefault(require("path"));
const sessionStore_1 = require("../sessionStore");
const sshExecutor_1 = require("./sshExecutor");
const backupManager_1 = require("./backupManager");
const types_1 = require("../types");
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
function validateAgentPath(filePath, workspaceRoot, allowSystemAccess = false) {
    if (!filePath || typeof filePath !== "string") {
        return "Path is required";
    }
    if (filePath.includes("\0")) {
        return "Path contains null bytes";
    }
    if (!path_1.default.isAbsolute(filePath)) {
        return "Path must be absolute";
    }
    const normalized = path_1.default.normalize(filePath);
    if (!allowSystemAccess && !normalized.startsWith(workspaceRoot)) {
        return `Path must be under workspace root: ${workspaceRoot} (System access required)`;
    }
    if (normalized.includes("/../") || normalized.endsWith("/..")) {
        return "Path traversal not allowed";
    }
    return null;
}
// ─── Command Validation ──────────────────────────────────────────
function validateCommand(command, allowSystemAccess = false) {
    if (!command || typeof command !== "string") {
        return "Command is required";
    }
    if (command.length > 4096) {
        return "Command too long (max 4096 chars)";
    }
    const baseCmd = command.trim().split(/\s+/)[0];
    const cmdName = path_1.default.basename(baseCmd);
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
function checkToolPermission(toolName, args, workspaceRoot, autoRunCommands) {
    if (toolName === "run_cmd") {
        if (!autoRunCommands) {
            return { requiresPermission: true, reason: "Auto-run commands is disabled" };
        }
        const err = validateCommand(args.command, false);
        if (err && err.includes("requires system access permission")) {
            return { requiresPermission: true, reason: `System command: ${args.command}` };
        }
    }
    const pathsToCheck = [];
    if (args.path)
        pathsToCheck.push(args.path);
    if (args.cwd)
        pathsToCheck.push(args.cwd);
    if (args.oldPath)
        pathsToCheck.push(args.oldPath);
    if (args.newPath)
        pathsToCheck.push(args.newPath);
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
function redactSecrets(content) {
    let redacted = content;
    for (const pattern of SECRET_PATTERNS) {
        redacted = redacted.replace(pattern, "[REDACTED]");
    }
    return redacted;
}
// ─── Tool Implementations ────────────────────────────────────────
class AgentTools {
    sshSessionId;
    workspaceRoot;
    fileChanges = [];
    snapshotsDone = new Set();
    constructor(sshSessionId, workspaceRoot) {
        this.sshSessionId = sshSessionId;
        this.workspaceRoot = workspaceRoot;
    }
    getFileChanges() {
        return [...this.fileChanges];
    }
    // ─── list_dir ──────────────────────────────────────────────────
    async listDir(dirPath, options) {
        const err = validateAgentPath(dirPath, this.workspaceRoot, options?.allowSystemAccess);
        if (err)
            throw new Error(err);
        const session = (0, sessionStore_1.getSession)(this.sshSessionId);
        if (!session)
            throw new Error("SSH session not found");
        const rawEntries = await (0, types_1.sftpReaddir)(session.sftp, dirPath);
        const entries = rawEntries
            .filter((e) => !e.filename.startsWith("."))
            .map((e) => ({
            name: e.filename,
            type: e.attrs.isDirectory() ? "directory" : "file",
            size: e.attrs.size,
        }))
            .sort((a, b) => {
            if (a.type !== b.type)
                return a.type === "directory" ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        return { entries };
    }
    // ─── read_file ─────────────────────────────────────────────────
    async readFile(filePath, options) {
        const err = validateAgentPath(filePath, this.workspaceRoot, options?.allowSystemAccess);
        if (err)
            throw new Error(err);
        const session = (0, sessionStore_1.getSession)(this.sshSessionId);
        if (!session)
            throw new Error("SSH session not found");
        const stats = await (0, types_1.sftpStat)(session.sftp, filePath);
        if (stats.size > MAX_FILE_SIZE) {
            throw new Error(`File too large (${stats.size} bytes, max ${MAX_FILE_SIZE})`);
        }
        const buf = await (0, types_1.sftpReadFile)(session.sftp, filePath);
        return { content: buf.toString("utf-8"), size: stats.size };
    }
    // ─── write_file (create or overwrite) ──────────────────────────
    async writeFile(filePath, content, options) {
        const err = validateAgentPath(filePath, this.workspaceRoot, options?.allowSystemAccess);
        if (err)
            throw new Error(err);
        if (this.fileChanges.length >= MAX_FILES_PER_SESSION) {
            throw new Error(`Max file changes per session exceeded (${MAX_FILES_PER_SESSION})`);
        }
        const session = (0, sessionStore_1.getSession)(this.sshSessionId);
        if (!session)
            throw new Error("SSH session not found");
        const buf = Buffer.from(content, "utf-8");
        if (buf.length > MAX_FILE_SIZE) {
            throw new Error(`Content too large (${buf.length} bytes, max ${MAX_FILE_SIZE})`);
        }
        // Snapshot existing file before first modification
        let fileExists = false;
        try {
            await (0, types_1.sftpStat)(session.sftp, filePath);
            fileExists = true;
        }
        catch {
            // File doesn't exist — new file
        }
        let snapshotPath;
        if (fileExists && !this.snapshotsDone.has(filePath)) {
            try {
                const backup = await backupManager_1.backupManager.createBackup(this.sshSessionId, filePath);
                snapshotPath = backup?.path;
                this.snapshotsDone.add(filePath);
            }
            catch (backupErr) {
                console.warn(`[agent] Backup failed for ${filePath}: ${backupErr.message}`);
            }
        }
        // Atomic write: temp file then rename
        const dir = path_1.default.dirname(filePath);
        const tmpName = `.vmide-agent-tmp.${Date.now()}`;
        const tmpPath = path_1.default.join(dir, tmpName);
        await (0, types_1.sftpWriteFile)(session.sftp, tmpPath, buf);
        await (0, types_1.sftpRename)(session.sftp, tmpPath, filePath);
        this.fileChanges.push({
            path: filePath,
            action: fileExists ? "modified" : "created",
            snapshotPath,
        });
        return { ok: true, size: buf.length };
    }
    // ─── create_file ───────────────────────────────────────────────
    async createFile(filePath, content, options) {
        const err = validateAgentPath(filePath, this.workspaceRoot, options?.allowSystemAccess);
        if (err)
            throw new Error(err);
        const session = (0, sessionStore_1.getSession)(this.sshSessionId);
        if (!session)
            throw new Error("SSH session not found");
        // Check file doesn't already exist
        try {
            await (0, types_1.sftpStat)(session.sftp, filePath);
            throw new Error(`File already exists: ${filePath}`);
        }
        catch (e) {
            if (e.message.includes("already exists"))
                throw e;
            // File doesn't exist — good
        }
        // Ensure parent directory exists
        const dir = path_1.default.dirname(filePath);
        try {
            await (0, types_1.sftpStat)(session.sftp, dir);
        }
        catch {
            await (0, types_1.sftpMkdir)(session.sftp, dir);
        }
        return this.writeFile(filePath, content, options);
    }
    // ─── delete_file ───────────────────────────────────────────────
    async deleteFile(filePath, options) {
        const err = validateAgentPath(filePath, this.workspaceRoot, options?.allowSystemAccess);
        if (err)
            throw new Error(err);
        const session = (0, sessionStore_1.getSession)(this.sshSessionId);
        if (!session)
            throw new Error("SSH session not found");
        // Snapshot before deleting
        if (!this.snapshotsDone.has(filePath)) {
            try {
                await backupManager_1.backupManager.createBackup(this.sshSessionId, filePath);
                this.snapshotsDone.add(filePath);
            }
            catch {
                // Non-fatal
            }
        }
        await (0, types_1.sftpUnlink)(session.sftp, filePath);
        this.fileChanges.push({ path: filePath, action: "deleted" });
        return { ok: true };
    }
    // ─── rename_file ───────────────────────────────────────────────
    async renameFile(oldPath, newPath, options) {
        const errOld = validateAgentPath(oldPath, this.workspaceRoot, options?.allowSystemAccess);
        if (errOld)
            throw new Error(errOld);
        const errNew = validateAgentPath(newPath, this.workspaceRoot, options?.allowSystemAccess);
        if (errNew)
            throw new Error(errNew);
        const session = (0, sessionStore_1.getSession)(this.sshSessionId);
        if (!session)
            throw new Error("SSH session not found");
        // Snapshot the old file
        if (!this.snapshotsDone.has(oldPath)) {
            try {
                await backupManager_1.backupManager.createBackup(this.sshSessionId, oldPath);
                this.snapshotsDone.add(oldPath);
            }
            catch {
                // Non-fatal
            }
        }
        await (0, types_1.sftpRename)(session.sftp, oldPath, newPath);
        this.fileChanges.push({ path: oldPath, action: "renamed" });
        return { ok: true };
    }
    // ─── search_files ──────────────────────────────────────────────
    async searchFiles(query, searchPath, options) {
        const targetPath = searchPath || this.workspaceRoot;
        const err = validateAgentPath(targetPath, this.workspaceRoot, options?.allowSystemAccess);
        if (err)
            throw new Error(err);
        // Sanitize query — no shell metacharacters
        if (SHELL_METACHAR_RE.test(query)) {
            throw new Error("Search query contains disallowed characters");
        }
        const result = await sshExecutor_1.sshExecutor.exec({
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
    async runCmd(command, cwd, options) {
        const cmdErr = validateCommand(command, options?.allowSystemAccess);
        if (cmdErr)
            throw new Error(cmdErr);
        if (cwd) {
            const pathErr = validateAgentPath(cwd, this.workspaceRoot, options?.allowSystemAccess);
            if (pathErr)
                throw new Error(pathErr);
        }
        const fullCmd = cwd ? `cd '${cwd}' && ${command}` : command;
        const result = await sshExecutor_1.sshExecutor.exec({
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
    async rollbackAll() {
        const restoredFiles = [];
        for (const change of this.fileChanges) {
            try {
                if (change.action === "created") {
                    // Delete files the agent created
                    const session = (0, sessionStore_1.getSession)(this.sshSessionId);
                    if (session) {
                        await (0, types_1.sftpUnlink)(session.sftp, change.path);
                        restoredFiles.push(change.path);
                    }
                }
                else if (change.snapshotPath) {
                    // Restore from backup
                    await backupManager_1.backupManager.restoreBackup(this.sshSessionId, change.snapshotPath, change.path);
                    restoredFiles.push(change.path);
                }
            }
            catch (err) {
                console.error(`[agent] Rollback failed for ${change.path}: ${err.message}`);
            }
        }
        return { restoredFiles };
    }
}
exports.AgentTools = AgentTools;
//# sourceMappingURL=agentTools.js.map