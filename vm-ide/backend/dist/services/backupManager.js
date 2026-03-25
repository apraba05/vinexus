"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupManager = exports.BackupManager = void 0;
const path_1 = __importDefault(require("path"));
const sessionStore_1 = require("../sessionStore");
const sshExecutor_1 = require("./sshExecutor");
const types_1 = require("../types");
const BACKUP_DIR_NAME = ".vmide-backups";
const DEFAULT_MAX_BACKUPS = 5;
class BackupManager {
    /**
     * Create a backup of a file before overwriting it.
     * Backup is stored in a sibling .vmide-backups/ directory.
     *
     * Naming: {filename}.{unix_timestamp}.bak
     * Example: /etc/nginx/.vmide-backups/nginx.conf.1708531200.bak
     */
    async createBackup(sessionId, filePath, maxBackups = DEFAULT_MAX_BACKUPS) {
        const session = (0, sessionStore_1.getSession)(sessionId);
        if (!session)
            throw new Error("Session not found or expired");
        // Check if the file exists first
        let fileStats;
        try {
            fileStats = await (0, types_1.sftpStat)(session.sftp, filePath);
        }
        catch {
            // File doesn't exist — nothing to back up
            return null;
        }
        const dir = path_1.default.dirname(filePath);
        const filename = path_1.default.basename(filePath);
        const backupDir = path_1.default.join(dir, BACKUP_DIR_NAME);
        const timestamp = Math.floor(Date.now() / 1000);
        const backupFilename = `${filename}.${timestamp}.bak`;
        const backupPath = path_1.default.join(backupDir, backupFilename);
        // Ensure backup directory exists
        await this.ensureBackupDir(sessionId, backupDir);
        // Copy file to backup using SSH cp (preserves permissions)
        const result = await sshExecutor_1.sshExecutor.exec({
            sessionId,
            command: `cp -p "${filePath}" "${backupPath}"`,
            timeout: 10_000,
        });
        if (result.exitCode !== 0) {
            throw new Error(`Failed to create backup: ${result.stderr}`);
        }
        // Prune old backups
        await this.pruneBackups(sessionId, filePath, maxBackups);
        return {
            path: backupPath,
            originalPath: filePath,
            timestamp,
            size: fileStats.size,
        };
    }
    /**
     * List all backups for a given file, sorted newest first.
     */
    async listBackups(sessionId, filePath) {
        const session = (0, sessionStore_1.getSession)(sessionId);
        if (!session)
            throw new Error("Session not found or expired");
        const dir = path_1.default.dirname(filePath);
        const filename = path_1.default.basename(filePath);
        const backupDir = path_1.default.join(dir, BACKUP_DIR_NAME);
        // Check if backup dir exists
        try {
            await (0, types_1.sftpStat)(session.sftp, backupDir);
        }
        catch {
            return []; // No backup directory = no backups
        }
        const entries = await (0, types_1.sftpReaddir)(session.sftp, backupDir);
        // Filter for backups of this specific file
        // Pattern: {filename}.{timestamp}.bak
        const prefix = `${filename}.`;
        const suffix = ".bak";
        const backups = entries
            .filter((e) => e.filename.startsWith(prefix) && e.filename.endsWith(suffix))
            .map((e) => {
            // Extract timestamp from filename
            const tsStr = e.filename.slice(prefix.length, e.filename.length - suffix.length);
            const timestamp = parseInt(tsStr, 10);
            return {
                path: path_1.default.join(backupDir, e.filename),
                originalPath: filePath,
                timestamp,
                size: e.attrs.size,
            };
        })
            .filter((b) => !isNaN(b.timestamp))
            .sort((a, b) => b.timestamp - a.timestamp); // newest first
        return backups;
    }
    /**
     * Restore a backup to its original path.
     */
    async restoreBackup(sessionId, backupPath, targetPath) {
        const session = (0, sessionStore_1.getSession)(sessionId);
        if (!session)
            throw new Error("Session not found or expired");
        // Verify backup exists
        await (0, types_1.sftpStat)(session.sftp, backupPath);
        // Create a backup of the current file before restoring
        try {
            await this.createBackup(sessionId, targetPath);
        }
        catch {
            // If the target file doesn't exist, that's fine
        }
        // Copy backup to target (use cp, not rename, so backup is preserved)
        const result = await sshExecutor_1.sshExecutor.exec({
            sessionId,
            command: `cp -p "${backupPath}" "${targetPath}"`,
            timeout: 10_000,
        });
        if (result.exitCode !== 0) {
            throw new Error(`Failed to restore backup: ${result.stderr}`);
        }
    }
    /**
     * Remove old backups beyond maxBackups count.
     */
    async pruneBackups(sessionId, filePath, maxBackups = DEFAULT_MAX_BACKUPS) {
        const session = (0, sessionStore_1.getSession)(sessionId);
        if (!session)
            throw new Error("Session not found or expired");
        const backups = await this.listBackups(sessionId, filePath);
        // backups are already sorted newest first
        const toDelete = backups.slice(maxBackups);
        for (const backup of toDelete) {
            try {
                await (0, types_1.sftpUnlink)(session.sftp, backup.path);
            }
            catch {
                // Ignore individual delete failures
            }
        }
    }
    /**
     * Ensure the .vmide-backups directory exists.
     */
    async ensureBackupDir(sessionId, backupDir) {
        const session = (0, sessionStore_1.getSession)(sessionId);
        if (!session)
            throw new Error("Session not found or expired");
        try {
            await (0, types_1.sftpStat)(session.sftp, backupDir);
        }
        catch {
            // Directory doesn't exist — create it
            try {
                await (0, types_1.sftpMkdir)(session.sftp, backupDir);
            }
            catch (mkdirErr) {
                // Could be a race condition (another request created it)
                if (!mkdirErr.message?.includes("already exists")) {
                    throw mkdirErr;
                }
            }
        }
    }
}
exports.BackupManager = BackupManager;
exports.backupManager = new BackupManager();
//# sourceMappingURL=backupManager.js.map