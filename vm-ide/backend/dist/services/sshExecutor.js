"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sshExecutor = exports.SSHExecutor = void 0;
const sessionStore_1 = require("../sessionStore");
const DEFAULT_TIMEOUT = 30_000;
class SSHExecutor {
    /**
     * Execute a command over SSH and collect all output.
     * Returns structured result with exit code, stdout, stderr, timing.
     */
    async exec(options) {
        const { sessionId, command, timeout = DEFAULT_TIMEOUT, sudo = false, env, stdin, } = options;
        const session = (0, sessionStore_1.getSession)(sessionId);
        if (!session) {
            throw new Error("Session not found or expired");
        }
        const fullCommand = this.buildCommand(command, sudo, env);
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            let timedOut = false;
            let streamRef = null;
            const timer = setTimeout(() => {
                timedOut = true;
                if (streamRef) {
                    try {
                        streamRef.signal('INT');
                        streamRef.close();
                    }
                    catch (e) { }
                }
            }, timeout);
            session.conn.exec(fullCommand, (err, stream) => {
                if (err) {
                    clearTimeout(timer);
                    return reject(new Error(`SSH exec failed: ${err.message}`));
                }
                streamRef = stream;
                let stdout = "";
                let stderr = "";
                stream.on("data", (data) => {
                    stdout += data.toString();
                });
                stream.stderr.on("data", (data) => {
                    stderr += data.toString();
                });
                stream.on("close", (code) => {
                    clearTimeout(timer);
                    resolve({
                        exitCode: code ?? (timedOut ? 124 : 1),
                        stdout,
                        stderr,
                        timedOut,
                        durationMs: Date.now() - startTime,
                    });
                });
                stream.on("error", (streamErr) => {
                    clearTimeout(timer);
                    reject(new Error(`SSH stream error: ${streamErr.message}`));
                });
                if (timedOut) {
                    stream.close();
                    return;
                }
                // Pipe stdin if provided
                if (stdin) {
                    stream.write(stdin);
                    stream.end();
                }
            });
        });
    }
    /**
     * Execute a command and stream output line-by-line via callbacks.
     * Useful for real-time log streaming and deploy progress.
     */
    async execStreaming(options, onStdout, onStderr) {
        const { sessionId, command, timeout = DEFAULT_TIMEOUT, sudo = false, env, stdin, } = options;
        const session = (0, sessionStore_1.getSession)(sessionId);
        if (!session) {
            throw new Error("Session not found or expired");
        }
        const fullCommand = this.buildCommand(command, sudo, env);
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            let timedOut = false;
            let fullStdout = "";
            let fullStderr = "";
            let streamRef = null;
            const timer = setTimeout(() => {
                timedOut = true;
                if (streamRef) {
                    try {
                        streamRef.signal('INT');
                        streamRef.close();
                    }
                    catch (e) { }
                }
            }, timeout);
            session.conn.exec(fullCommand, (err, stream) => {
                if (err) {
                    clearTimeout(timer);
                    return reject(new Error(`SSH exec failed: ${err.message}`));
                }
                streamRef = stream;
                let stdoutBuffer = "";
                let stderrBuffer = "";
                stream.on("data", (data) => {
                    const text = data.toString();
                    fullStdout += text;
                    stdoutBuffer += text;
                    const lines = stdoutBuffer.split("\n");
                    // Keep the last partial line in the buffer
                    stdoutBuffer = lines.pop() || "";
                    for (const line of lines) {
                        onStdout(line);
                    }
                });
                stream.stderr.on("data", (data) => {
                    const text = data.toString();
                    fullStderr += text;
                    stderrBuffer += text;
                    const lines = stderrBuffer.split("\n");
                    stderrBuffer = lines.pop() || "";
                    for (const line of lines) {
                        onStderr(line);
                    }
                });
                stream.on("close", (code) => {
                    clearTimeout(timer);
                    // Flush remaining buffered content
                    if (stdoutBuffer)
                        onStdout(stdoutBuffer);
                    if (stderrBuffer)
                        onStderr(stderrBuffer);
                    resolve({
                        exitCode: code ?? (timedOut ? 124 : 1),
                        stdout: fullStdout,
                        stderr: fullStderr,
                        timedOut,
                        durationMs: Date.now() - startTime,
                    });
                });
                stream.on("error", (streamErr) => {
                    clearTimeout(timer);
                    reject(new Error(`SSH stream error: ${streamErr.message}`));
                });
                if (timedOut) {
                    stream.close();
                    return;
                }
                if (stdin) {
                    stream.write(stdin);
                    stream.end();
                }
            });
        });
    }
    /**
     * Build the full command string with optional sudo and env vars.
     */
    buildCommand(command, sudo, env) {
        let full = command;
        if (env && Object.keys(env).length > 0) {
            const envPrefix = Object.entries(env)
                .map(([k, v]) => `${k}=${this.shellEscape(v)}`)
                .join(" ");
            full = `${envPrefix} ${full}`;
        }
        if (sudo) {
            full = `sudo ${full}`;
        }
        return full;
    }
    /**
     * Escape a value for safe shell interpolation.
     */
    shellEscape(value) {
        return `'${value.replace(/'/g, "'\\''")}'`;
    }
}
exports.SSHExecutor = SSHExecutor;
// Singleton instance
exports.sshExecutor = new SSHExecutor();
//# sourceMappingURL=sshExecutor.js.map