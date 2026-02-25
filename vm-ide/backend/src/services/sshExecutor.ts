import { getSession } from "../sessionStore";
import { ExecOptions, ExecResult } from "../types";

const DEFAULT_TIMEOUT = 30_000;

export class SSHExecutor {
  /**
   * Execute a command over SSH and collect all output.
   * Returns structured result with exit code, stdout, stderr, timing.
   */
  async exec(options: ExecOptions): Promise<ExecResult> {
    const {
      sessionId,
      command,
      timeout = DEFAULT_TIMEOUT,
      sudo = false,
      env,
      stdin,
    } = options;

    const session = getSession(sessionId);
    if (!session) {
      throw new Error("Session not found or expired");
    }

    const fullCommand = this.buildCommand(command, sudo, env);

    return new Promise<ExecResult>((resolve, reject) => {
      const startTime = Date.now();
      let timedOut = false;
      let streamRef: any = null;

      const timer = setTimeout(() => {
        timedOut = true;
        if (streamRef) {
          try {
            streamRef.signal('INT');
            streamRef.close();
          } catch (e) { }
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

        stream.on("data", (data: Buffer) => {
          stdout += data.toString();
        });

        stream.stderr.on("data", (data: Buffer) => {
          stderr += data.toString();
        });

        stream.on("close", (code: number | null) => {
          clearTimeout(timer);
          resolve({
            exitCode: code ?? (timedOut ? 124 : 1),
            stdout,
            stderr,
            timedOut,
            durationMs: Date.now() - startTime,
          });
        });

        stream.on("error", (streamErr: Error) => {
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
  async execStreaming(
    options: ExecOptions,
    onStdout: (line: string) => void,
    onStderr: (line: string) => void
  ): Promise<ExecResult> {
    const {
      sessionId,
      command,
      timeout = DEFAULT_TIMEOUT,
      sudo = false,
      env,
      stdin,
    } = options;

    const session = getSession(sessionId);
    if (!session) {
      throw new Error("Session not found or expired");
    }

    const fullCommand = this.buildCommand(command, sudo, env);

    return new Promise<ExecResult>((resolve, reject) => {
      const startTime = Date.now();
      let timedOut = false;
      let fullStdout = "";
      let fullStderr = "";
      let streamRef: any = null;

      const timer = setTimeout(() => {
        timedOut = true;
        if (streamRef) {
          try {
            streamRef.signal('INT');
            streamRef.close();
          } catch (e) { }
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

        stream.on("data", (data: Buffer) => {
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

        stream.stderr.on("data", (data: Buffer) => {
          const text = data.toString();
          fullStderr += text;
          stderrBuffer += text;

          const lines = stderrBuffer.split("\n");
          stderrBuffer = lines.pop() || "";
          for (const line of lines) {
            onStderr(line);
          }
        });

        stream.on("close", (code: number | null) => {
          clearTimeout(timer);

          // Flush remaining buffered content
          if (stdoutBuffer) onStdout(stdoutBuffer);
          if (stderrBuffer) onStderr(stderrBuffer);

          resolve({
            exitCode: code ?? (timedOut ? 124 : 1),
            stdout: fullStdout,
            stderr: fullStderr,
            timedOut,
            durationMs: Date.now() - startTime,
          });
        });

        stream.on("error", (streamErr: Error) => {
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
  private buildCommand(
    command: string,
    sudo: boolean,
    env?: Record<string, string>
  ): string {
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
  private shellEscape(value: string): string {
    return `'${value.replace(/'/g, "'\\''")}'`;
  }
}

// Singleton instance
export const sshExecutor = new SSHExecutor();
