import { sshExecutor } from "./sshExecutor";
import { LogEntry, LogPriority } from "../types";

// journalctl priority levels
const PRIORITY_MAP: Record<string, LogPriority> = {
  "0": "emerg",
  "1": "alert",
  "2": "crit",
  "3": "err",
  "4": "warning",
  "5": "notice",
  "6": "info",
  "7": "debug",
  emerg: "emerg",
  alert: "alert",
  crit: "crit",
  err: "err",
  warning: "warning",
  notice: "notice",
  info: "info",
  debug: "debug",
};

export class LogStreamer {
  /**
   * Fetch the last N lines of logs for a service (one-shot).
   */
  async fetchLogs(
    sessionId: string,
    service: string,
    lines: number = 50
  ): Promise<LogEntry[]> {
    const result = await sshExecutor.exec({
      sessionId,
      command: `journalctl -u ${service} --no-pager -n ${lines} -o json 2>/dev/null || journalctl -u ${service} --no-pager -n ${lines}`,
      timeout: 10_000,
    });

    if (!result.stdout.trim()) {
      return [];
    }

    // Try JSON parsing first (journalctl -o json)
    const entries = this.tryParseJsonLogs(result.stdout);
    if (entries.length > 0) return entries;

    // Fall back to plain text parsing
    return this.parsePlainLogs(result.stdout, service);
  }

  /**
   * Fetch logs with streaming output via callback (for real-time tailing).
   * Returns a stop function.
   */
  async startStreaming(
    sessionId: string,
    service: string,
    onEntry: (entry: LogEntry) => void,
    onError: (error: string) => void
  ): Promise<{ stop: () => void }> {
    let stopped = false;

    // Start journalctl -f in streaming mode
    const execPromise = sshExecutor.execStreaming(
      {
        sessionId,
        command: `journalctl -u ${service} --no-pager -f -o short-iso`,
        timeout: 300_000, // 5 minute max streaming time
      },
      (line) => {
        if (stopped) return;
        const entry = this.parseSingleLine(line, service);
        if (entry) onEntry(entry);
      },
      (line) => {
        if (stopped) return;
        if (line.trim()) onError(line);
      }
    );

    // Don't await — it runs until timeout or stop
    execPromise.catch(() => {
      // Stream ended
    });

    return {
      stop: () => {
        stopped = true;
      },
    };
  }

  /**
   * Parse journalctl JSON output lines.
   */
  private tryParseJsonLogs(output: string): LogEntry[] {
    const entries: LogEntry[] = [];

    for (const line of output.split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        entries.push({
          timestamp: this.formatTimestamp(obj.__REALTIME_TIMESTAMP || obj._SOURCE_REALTIME_TIMESTAMP),
          unit: obj._SYSTEMD_UNIT || obj.SYSLOG_IDENTIFIER || "unknown",
          message: obj.MESSAGE || "",
          priority: PRIORITY_MAP[String(obj.PRIORITY)] || "info",
        });
      } catch {
        // Not valid JSON line
        return []; // Fall back to plain text
      }
    }

    return entries;
  }

  /**
   * Parse plain text journalctl output.
   */
  private parsePlainLogs(output: string, defaultUnit: string): LogEntry[] {
    const entries: LogEntry[] = [];

    for (const line of output.split("\n")) {
      if (!line.trim()) continue;
      const entry = this.parseSingleLine(line, defaultUnit);
      if (entry) entries.push(entry);
    }

    return entries;
  }

  /**
   * Parse a single journalctl plain-text line.
   * Format: "Feb 22 14:30:01 hostname service[pid]: message"
   * Or ISO: "2026-02-22T14:30:01+0000 hostname service[pid]: message"
   */
  private parseSingleLine(line: string, defaultUnit: string): LogEntry | null {
    if (!line.trim()) return null;

    // Try ISO format first (from -o short-iso)
    const isoMatch = line.match(
      /^(\d{4}-\d{2}-\d{2}T[\d:]+[+-]\d{4})\s+\S+\s+(\S+?)(?:\[\d+\])?:\s*(.*)$/
    );
    if (isoMatch) {
      return {
        timestamp: isoMatch[1],
        unit: isoMatch[2],
        message: isoMatch[3],
        priority: this.inferPriority(isoMatch[3]),
      };
    }

    // Try standard syslog format
    const syslogMatch = line.match(
      /^(\w{3}\s+\d+\s+[\d:]+)\s+\S+\s+(\S+?)(?:\[\d+\])?:\s*(.*)$/
    );
    if (syslogMatch) {
      return {
        timestamp: syslogMatch[1],
        unit: syslogMatch[2],
        message: syslogMatch[3],
        priority: this.inferPriority(syslogMatch[3]),
      };
    }

    // Fallback: treat entire line as message
    return {
      timestamp: new Date().toISOString(),
      unit: defaultUnit,
      message: line,
      priority: this.inferPriority(line),
    };
  }

  /**
   * Infer log priority from message content.
   */
  private inferPriority(message: string): LogPriority {
    const lower = message.toLowerCase();
    if (
      lower.includes("fatal") ||
      lower.includes("panic") ||
      lower.includes("emerg")
    )
      return "emerg";
    if (lower.includes("critical") || lower.includes("crit")) return "crit";
    if (
      lower.includes("error") ||
      lower.includes("failed") ||
      lower.includes("failure") ||
      lower.includes("exception")
    )
      return "err";
    if (lower.includes("warn")) return "warning";
    if (lower.includes("debug") || lower.includes("trace")) return "debug";
    return "info";
  }

  /**
   * Format a microsecond timestamp from journalctl JSON.
   */
  private formatTimestamp(usTimestamp: string | undefined): string {
    if (!usTimestamp) return new Date().toISOString();
    const ms = parseInt(usTimestamp, 10) / 1000;
    return new Date(ms).toISOString();
  }
}

export const logStreamer = new LogStreamer();
