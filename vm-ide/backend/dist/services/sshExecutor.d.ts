import { ExecOptions, ExecResult } from "../types";
export declare class SSHExecutor {
    /**
     * Execute a command over SSH and collect all output.
     * Returns structured result with exit code, stdout, stderr, timing.
     */
    exec(options: ExecOptions): Promise<ExecResult>;
    /**
     * Execute a command and stream output line-by-line via callbacks.
     * Useful for real-time log streaming and deploy progress.
     */
    execStreaming(options: ExecOptions, onStdout: (line: string) => void, onStderr: (line: string) => void): Promise<ExecResult>;
    /**
     * Build the full command string with optional sudo and env vars.
     */
    private buildCommand;
    /**
     * Escape a value for safe shell interpolation.
     */
    private shellEscape;
}
export declare const sshExecutor: SSHExecutor;
//# sourceMappingURL=sshExecutor.d.ts.map