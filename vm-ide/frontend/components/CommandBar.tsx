"use client";
import React, { useState, useEffect, useCallback } from "react";
import { CommandTemplate, CommandResult, runCommand } from "@/lib/api";

interface Props {
  sessionId: string | null;
  templates: CommandTemplate[];
  onFetchTemplates: () => void;
  onResult: (result: CommandResult) => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

interface RunningState {
  templateId: string;
  loading: boolean;
}

export default function CommandBar({
  sessionId,
  templates,
  onFetchTemplates,
  onResult,
  onError,
  onSuccess,
}: Props) {
  const [running, setRunning] = useState<RunningState | null>(null);
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [serviceInput, setServiceInput] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      onFetchTemplates();
    }
  }, [sessionId, onFetchTemplates]);

  const handleRun = useCallback(
    async (templateId: string, params: Record<string, string | number> = {}) => {
      if (!sessionId) return;

      setRunning({ templateId, loading: true });
      setActiveDropdown(null);

      try {
        const result = await runCommand(sessionId, templateId, params);
        setRunning(null);
        setLastResult(result);
        setShowOutput(true);
        onResult(result);

        if (result.exitCode === 0) {
          onSuccess(`Command completed successfully (${result.durationMs}ms)`);
        } else {
          onError(`Command failed with exit code ${result.exitCode}`);
        }
      } catch (err: any) {
        setRunning(null);
        onError(err.message);
      }
    },
    [sessionId, onResult, onError, onSuccess]
  );

  const handleRunWithService = useCallback(
    (templateId: string) => {
      if (!serviceInput.trim()) {
        onError("Please enter a service name");
        return;
      }
      handleRun(templateId, { service: serviceInput.trim() });
    },
    [serviceInput, handleRun, onError]
  );

  if (!sessionId) return null;

  // Group templates by category
  const categories = new Map<string, CommandTemplate[]>();
  for (const t of templates) {
    if (!categories.has(t.category)) categories.set(t.category, []);
    categories.get(t.category)!.push(t);
  }

  // Quick action buttons (no parameters needed)
  const quickActions = templates.filter((t) => t.parameters.length === 0);
  // Service commands (need a service name)
  const serviceCommands = templates.filter(
    (t) => t.parameters.some((p) => p.name === "service")
  );

  return (
    <div style={styles.container}>
      <div style={styles.bar}>
        {/* Service name input */}
        <div style={styles.serviceGroup}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
          <input
            style={styles.serviceInput}
            type="text"
            placeholder="service name (e.g. nginx)"
            value={serviceInput}
            onChange={(e) => setServiceInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && serviceInput.trim()) {
                handleRunWithService("systemd-status");
              }
            }}
          />
        </div>

        {/* Service commands */}
        {serviceCommands
          .filter((t) => ["systemd-restart", "systemd-status"].includes(t.id))
          .map((t) => (
            <button
              key={t.id}
              style={{
                ...styles.btn,
                ...(t.dangerLevel === "moderate" ? styles.btnModerate : {}),
                ...(running?.templateId === t.id ? styles.btnRunning : {}),
              }}
              disabled={!serviceInput.trim() || running !== null}
              onClick={() => handleRunWithService(t.id)}
              title={t.description}
            >
              {running?.templateId === t.id ? (
                <span style={styles.spinner} />
              ) : (
                <CmdIcon id={t.id} />
              )}
              <span>{t.name}</span>
            </button>
          ))}

        <div style={styles.sep} />

        {/* Quick actions (no params needed) */}
        {quickActions.map((t) => (
          <button
            key={t.id}
            style={{
              ...styles.btn,
              ...(t.dangerLevel === "moderate" ? styles.btnModerate : {}),
              ...(t.dangerLevel === "dangerous" ? styles.btnDanger : {}),
              ...(running?.templateId === t.id ? styles.btnRunning : {}),
            }}
            disabled={running !== null}
            onClick={() => handleRun(t.id)}
            title={t.description}
          >
            {running?.templateId === t.id ? (
              <span style={styles.spinner} />
            ) : (
              <CmdIcon id={t.id} />
            )}
            <span>{t.name}</span>
          </button>
        ))}

        {/* View Logs button (special, needs service) */}
        {templates.find((t) => t.id === "journal-logs") && (
          <>
            <div style={styles.sep} />
            <button
              style={styles.btn}
              disabled={!serviceInput.trim() || running !== null}
              onClick={() =>
                handleRunWithService("journal-logs")
              }
              title="View recent service logs"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Logs</span>
            </button>
          </>
        )}
      </div>

      {/* Output panel */}
      {showOutput && lastResult && (
        <div style={styles.output}>
          <div style={styles.outputHeader}>
            <div style={styles.outputTitle}>
              <span
                style={{
                  ...styles.exitBadge,
                  background:
                    lastResult.exitCode === 0
                      ? "rgba(81, 207, 102, 0.15)"
                      : "rgba(255, 107, 107, 0.15)",
                  color:
                    lastResult.exitCode === 0
                      ? "var(--success)"
                      : "var(--danger)",
                }}
              >
                exit {lastResult.exitCode}
              </span>
              <code style={styles.commandText}>{lastResult.command}</code>
              <span style={styles.duration}>{lastResult.durationMs}ms</span>
            </div>
            <button
              style={styles.closeBtn}
              onClick={() => setShowOutput(false)}
            >
              ×
            </button>
          </div>
          <pre style={styles.outputPre}>
            {lastResult.stdout || lastResult.stderr || "(no output)"}
          </pre>
        </div>
      )}
    </div>
  );
}

function CmdIcon({ id }: { id: string }) {
  // Simple icons per command type
  const icons: Record<string, string> = {
    "systemd-restart":
      "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
    "systemd-status":
      "M22 12h-4l-3 9L9 3l-3 9H2",
    "systemd-start":
      "M5 3l14 9-14 9V3z",
    "systemd-stop":
      "M6 4h4v16H6zM14 4h4v16h-4z",
    "nginx-test":
      "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    "nginx-reload":
      "M23 4v6h-6M1 20v-6h6",
    "systemd-daemon-reload":
      "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  };
  const d = icons[id] || "M4 17l6-6-6-6M12 19h8";
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    borderBottom: "1px solid var(--border)",
  },
  bar: {
    display: "flex",
    alignItems: "center",
    padding: "4px 12px",
    background: "var(--bg-secondary)",
    gap: 4,
    flexWrap: "wrap",
  },
  serviceGroup: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "0 4px",
  },
  serviceInput: {
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "4px 8px",
    fontSize: 11,
    color: "var(--text-primary)",
    width: 160,
    outline: "none",
    fontFamily: "monospace",
  },
  btn: {
    padding: "4px 10px",
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid transparent",
    borderRadius: 4,
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
  },
  btnModerate: {
    color: "var(--warning, #f0c040)",
  },
  btnDanger: {
    color: "var(--danger)",
  },
  btnRunning: {
    opacity: 0.6,
    cursor: "wait",
  },
  sep: {
    width: 1,
    height: 16,
    background: "var(--border)",
    margin: "0 4px",
    flexShrink: 0,
  },
  spinner: {
    display: "inline-block",
    width: 10,
    height: 10,
    border: "2px solid var(--text-secondary)",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },
  output: {
    background: "var(--bg-primary)",
    borderTop: "1px solid var(--border)",
    maxHeight: 250,
    display: "flex",
    flexDirection: "column",
  },
  outputHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 12px",
    background: "var(--bg-secondary)",
    flexShrink: 0,
  },
  outputTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
  },
  exitBadge: {
    padding: "2px 6px",
    borderRadius: 3,
    fontSize: 10,
    fontWeight: 600,
    fontFamily: "monospace",
  },
  commandText: {
    color: "var(--text-secondary)",
    fontSize: 11,
  },
  duration: {
    color: "var(--text-secondary)",
    fontSize: 10,
    opacity: 0.6,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-secondary)",
    fontSize: 16,
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1,
  },
  outputPre: {
    margin: 0,
    padding: "8px 12px",
    fontSize: 11,
    fontFamily: "'Cascadia Code', 'Fira Code', monospace",
    color: "var(--text-primary)",
    overflow: "auto",
    flex: 1,
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    lineHeight: 1.5,
  },
};
