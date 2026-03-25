import { LogEntry } from "../types";
export declare class LogStreamer {
    /**
     * Fetch the last N lines of logs for a service (one-shot).
     */
    fetchLogs(sessionId: string, service: string, lines?: number): Promise<LogEntry[]>;
    /**
     * Fetch logs with streaming output via callback (for real-time tailing).
     * Returns a stop function.
     */
    startStreaming(sessionId: string, service: string, onEntry: (entry: LogEntry) => void, onError: (error: string) => void): Promise<{
        stop: () => void;
    }>;
    /**
     * Parse journalctl JSON output lines.
     */
    private tryParseJsonLogs;
    /**
     * Parse plain text journalctl output.
     */
    private parsePlainLogs;
    /**
     * Parse a single journalctl plain-text line.
     * Format: "Feb 22 14:30:01 hostname service[pid]: message"
     * Or ISO: "2026-02-22T14:30:01+0000 hostname service[pid]: message"
     */
    private parseSingleLine;
    /**
     * Infer log priority from message content.
     */
    private inferPriority;
    /**
     * Format a microsecond timestamp from journalctl JSON.
     */
    private formatTimestamp;
}
export declare const logStreamer: LogStreamer;
//# sourceMappingURL=logStreamer.d.ts.map