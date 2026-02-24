"use client";
import React, { useRef, useEffect, useState } from "react";
import { LogEntry } from "@/lib/api";
import { usePlan } from "@/contexts/PlanContext";

interface Props {
  entries: LogEntry[];
  loading: boolean;
  service: string | null;
  onFetch: (service: string, lines?: number) => void;
  onClear: () => void;
  serviceInput?: string;
  onDiagnose?: (service: string, logs: string) => void;
  diagnosing?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  emerg: "#ff4444",
  alert: "#ff4444",
  crit: "#ff6666",
  err: "#ff6b6b",
  warning: "#f0c040",
  notice: "#51cf66",
  info: "#cccccc",
  debug: "#7a7a9a",
};

const PRIORITY_LABELS: Record<string, string> = {
  emerg: "EMRG",
  alert: "ALRT",
  crit: "CRIT",
  err: " ERR",
  warning: "WARN",
  notice: "NOTE",
  info: "INFO",
  debug: " DBG",
};

export default function LogsPanel({
  entries,
  loading,
  service,
  onFetch,
  onClear,
  serviceInput,
  onDiagnose,
  diagnosing = false,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const { features } = usePlan();

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  const filteredEntries = filter
    ? entries.filter(
        (e) =>
          e.message.toLowerCase().includes(filter.toLowerCase()) ||
          e.priority.includes(filter.toLowerCase())
      )
    : entries;

  if (!service && entries.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyContent}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2, marginBottom: 8 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            Enter a service name in the command bar and click Logs, or logs will appear here after a deploy.
          </div>
          {serviceInput && (
            <button
              style={styles.fetchBtn}
              onClick={() => onFetch(serviceInput)}
            >
              Fetch logs for {serviceInput}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          {service && (
            <span style={styles.serviceBadge}>{service}</span>
          )}
          <span style={styles.count}>{filteredEntries.length} entries</span>
        </div>
        <div style={styles.toolbarRight}>
          <input
            style={styles.filterInput}
            type="text"
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button
            style={{
              ...styles.toolBtn,
              ...(autoScroll ? styles.toolBtnActive : {}),
            }}
            onClick={() => setAutoScroll(!autoScroll)}
            title="Auto-scroll"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="7 13 12 18 17 13" />
              <polyline points="7 6 12 11 17 6" />
            </svg>
          </button>
          {service && (
            <button
              style={styles.toolBtn}
              onClick={() => onFetch(service, 100)}
              disabled={loading}
              title="Refresh"
            >
              {loading ? (
                <span style={styles.miniSpinner} />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              )}
            </button>
          )}
          {onDiagnose && service && entries.length > 0 && (
            <button
              style={{
                ...styles.diagnoseBtn,
                ...(diagnosing ? { opacity: 0.6 } : {}),
                ...(!features.ai ? { opacity: 0.5 } : {}),
              }}
              onClick={features.ai ? () => {
                const logText = entries
                  .slice(-50)
                  .map((e) => `${e.timestamp} [${e.priority}] ${e.message}`)
                  .join("\n");
                onDiagnose(service, logText);
              } : undefined}
              disabled={diagnosing || !features.ai}
              title={features.ai ? "Analyze logs with AI" : "Pro feature — upgrade to unlock"}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {diagnosing ? "Analyzing..." : "Why?"}
              {!features.ai && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
            </button>
          )}
          <button style={styles.toolBtn} onClick={onClear} title="Clear">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        style={styles.logArea}
        onScroll={() => {
          if (!scrollRef.current) return;
          const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
          setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
        }}
      >
        {filteredEntries.map((entry, i) => (
          <div key={i} style={styles.logLine}>
            <span style={styles.logTimestamp}>
              {formatTimestamp(entry.timestamp)}
            </span>
            <span
              style={{
                ...styles.logPriority,
                color: PRIORITY_COLORS[entry.priority] || "#cccccc",
              }}
            >
              {PRIORITY_LABELS[entry.priority] || entry.priority}
            </span>
            <span
              style={{
                ...styles.logMessage,
                color:
                  entry.priority === "err" || entry.priority === "crit"
                    ? "var(--danger)"
                    : entry.priority === "warning"
                    ? "#f0c040"
                    : "var(--text-primary)",
              }}
            >
              {entry.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts.slice(0, 19);
    return d.toLocaleTimeString("en-US", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
  } catch {
    return ts.slice(0, 19);
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    background: "var(--bg-primary)",
  },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    background: "var(--bg-primary)",
  },
  emptyContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    maxWidth: 320,
  },
  fetchBtn: {
    padding: "6px 14px",
    background: "rgba(6, 182, 212, 0.1)",
    color: "var(--accent)",
    border: "1px solid rgba(6, 182, 212, 0.2)",
    borderRadius: 5,
    fontSize: 12,
    cursor: "pointer",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 8px",
    background: "var(--bg-secondary)",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  toolbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  toolbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  serviceBadge: {
    padding: "2px 8px",
    background: "var(--bg-tertiary)",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    fontFamily: "monospace",
    color: "var(--accent)",
  },
  count: {
    fontSize: 10,
    color: "var(--text-secondary)",
    opacity: 0.6,
  },
  filterInput: {
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "3px 6px",
    fontSize: 11,
    color: "var(--text-primary)",
    width: 120,
    outline: "none",
    fontFamily: "monospace",
  },
  toolBtn: {
    padding: "3px 6px",
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid transparent",
    borderRadius: 3,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  toolBtnActive: {
    background: "rgba(6, 182, 212, 0.15)",
    color: "var(--accent)",
    border: "1px solid rgba(6, 182, 212, 0.2)",
  },
  diagnoseBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 8px",
    background: "rgba(6, 182, 212, 0.1)",
    color: "var(--accent)",
    border: "1px solid rgba(6, 182, 212, 0.2)",
    borderRadius: 3,
    cursor: "pointer",
    fontSize: 10,
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },
  miniSpinner: {
    display: "inline-block",
    width: 10,
    height: 10,
    border: "2px solid var(--text-secondary)",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },
  logArea: {
    flex: 1,
    overflow: "auto",
    fontFamily: "'Cascadia Code', 'Fira Code', monospace",
    fontSize: 11,
    lineHeight: 1.6,
    padding: "4px 0",
  },
  logLine: {
    display: "flex",
    padding: "0 8px",
    gap: 8,
    whiteSpace: "nowrap",
  },
  logTimestamp: {
    color: "var(--text-secondary)",
    opacity: 0.5,
    flexShrink: 0,
    minWidth: 85,
  },
  logPriority: {
    fontWeight: 700,
    flexShrink: 0,
    minWidth: 40,
    textAlign: "right",
  },
  logMessage: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    minWidth: 0,
  },
};
