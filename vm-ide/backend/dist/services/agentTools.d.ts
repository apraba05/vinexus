import { AgentFileChange } from "../types";
export declare function validateAgentPath(filePath: string, workspaceRoot: string, allowSystemAccess?: boolean): string | null;
export declare function validateCommand(command: string, allowSystemAccess?: boolean): string | null;
export declare function checkToolPermission(toolName: string, args: Record<string, any>, workspaceRoot: string, autoRunCommands: boolean): {
    requiresPermission: boolean;
    reason?: string;
};
export declare function redactSecrets(content: string): string;
export declare class AgentTools {
    private sshSessionId;
    private workspaceRoot;
    private fileChanges;
    private snapshotsDone;
    constructor(sshSessionId: string, workspaceRoot: string);
    getFileChanges(): AgentFileChange[];
    listDir(dirPath: string, options?: {
        allowSystemAccess?: boolean;
    }): Promise<{
        entries: Array<{
            name: string;
            type: string;
            size: number;
        }>;
    }>;
    readFile(filePath: string, options?: {
        allowSystemAccess?: boolean;
    }): Promise<{
        content: string;
        size: number;
    }>;
    writeFile(filePath: string, content: string, options?: {
        allowSystemAccess?: boolean;
    }): Promise<{
        ok: boolean;
        size: number;
    }>;
    createFile(filePath: string, content: string, options?: {
        allowSystemAccess?: boolean;
    }): Promise<{
        ok: boolean;
    }>;
    deleteFile(filePath: string, options?: {
        allowSystemAccess?: boolean;
    }): Promise<{
        ok: boolean;
    }>;
    renameFile(oldPath: string, newPath: string, options?: {
        allowSystemAccess?: boolean;
    }): Promise<{
        ok: boolean;
    }>;
    searchFiles(query: string, searchPath?: string, options?: {
        allowSystemAccess?: boolean;
    }): Promise<{
        matches: string[];
    }>;
    runCmd(command: string, cwd?: string, options?: {
        allowSystemAccess?: boolean;
    }): Promise<{
        exitCode: number;
        stdout: string;
        stderr: string;
        durationMs: number;
    }>;
    rollbackAll(): Promise<{
        restoredFiles: string[];
    }>;
}
//# sourceMappingURL=agentTools.d.ts.map