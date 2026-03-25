import { BackupEntry } from "../types";
export declare class BackupManager {
    /**
     * Create a backup of a file before overwriting it.
     * Backup is stored in a sibling .vmide-backups/ directory.
     *
     * Naming: {filename}.{unix_timestamp}.bak
     * Example: /etc/nginx/.vmide-backups/nginx.conf.1708531200.bak
     */
    createBackup(sessionId: string, filePath: string, maxBackups?: number): Promise<BackupEntry | null>;
    /**
     * List all backups for a given file, sorted newest first.
     */
    listBackups(sessionId: string, filePath: string): Promise<BackupEntry[]>;
    /**
     * Restore a backup to its original path.
     */
    restoreBackup(sessionId: string, backupPath: string, targetPath: string): Promise<void>;
    /**
     * Remove old backups beyond maxBackups count.
     */
    pruneBackups(sessionId: string, filePath: string, maxBackups?: number): Promise<void>;
    /**
     * Ensure the .vmide-backups directory exists.
     */
    private ensureBackupDir;
}
export declare const backupManager: BackupManager;
//# sourceMappingURL=backupManager.d.ts.map