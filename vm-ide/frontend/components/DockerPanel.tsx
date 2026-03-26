"use client";
import React, { useState, useEffect, useCallback } from "react";
import { electronSsh } from "@/lib/electron";

interface Container {
  ID: string;
  Names: string;
  Image: string;
  Status: string;
  State: string;
  Ports: string;
}

interface Props {
  sessionId: string | null;
  onRunInTerminal: (cmd: string) => void;
}

export default function DockerPanel({ sessionId, onRunInTerminal }: Props) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [runningActions, setRunningActions] = useState<Set<string>>(new Set());
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const [inspectData, setInspectData] = useState<{ name: string; json: string } | null>(null);

  const fetchContainers = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setFetchError(null);
    try {
      const result = await electronSsh.exec(
        sessionId,
        `docker ps -a --format "{{json .}}" 2>&1`
      );
      if (result?.error) { setFetchError(result.error); return; }
      const stdout: string = result?.stdout ?? "";
      if (result?.exitCode !== 0) {
        setFetchError(result?.stderr || stdout || "docker ps failed");
        return;
      }
      const lines = stdout.trim().split("\n").filter(Boolean);
      const parsed: Container[] = [];
      for (const line of lines) {
        try { parsed.push(JSON.parse(line)); } catch { /* skip malformed line */ }
      }
      setContainers(parsed);
    } catch (e: any) {
      setFetchError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchContainers();
    } else {
      setContainers([]);
      setFetchError(null);
      setInspectData(null);
    }
  }, [sessionId, fetchContainers]);

  const markRunning = useCallback((key: string, on: boolean) => {
    setRunningActions((prev) => {
      const next = new Set(prev);
      on ? next.add(key) : next.delete(key);
      return next;
    });
  }, []);

  const clearActionError = useCallback((key: string) => {
    setActionErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }, []);

  const runContainerAction = useCallback(async (
    container: Container,
    action: "start" | "stop" | "restart"
  ) => {
    if (!sessionId) return;
    const key = `${container.ID}:${action}`;
    markRunning(key, true);
    clearActionError(key);
    try {
      const result = await electronSsh.exec(sessionId, `docker ${action} ${container.Names} 2>&1`);
      if (result?.exitCode !== 0 || result?.error) {
        const msg = result?.stderr || result?.stdout || result?.error || `docker ${action} failed`;
        setActionErrors((prev) => ({ ...prev, [key]: msg }));
      } else {
        await fetchContainers();
      }
    } catch (e: any) {
      setActionErrors((prev) => ({ ...prev, [key]: e.message }));
    } finally {
      markRunning(key, false);
    }
  }, [sessionId, fetchContainers, markRunning, clearActionError]);

  const viewLogs = useCallback((container: Container) => {
    onRunInTerminal(`docker logs --follow --tail 200 ${container.Names}`);
  }, [onRunInTerminal]);

  const inspectContainer = useCallback(async (container: Container) => {
    if (!sessionId) return;
    const key = `${container.ID}:inspect`;
    markRunning(key, true);
    clearActionError(key);
    try {
      const result = await electronSsh.exec(sessionId, `docker inspect ${container.Names} 2>&1`);
      if (result?.exitCode !== 0 || result?.error) {
        const msg = result?.stderr || result?.stdout || result?.error || "docker inspect failed";
        setActionErrors((prev) => ({ ...prev, [key]: msg }));
      } else {
        // Pretty-print the JSON
        try {
          const parsed = JSON.parse(result.stdout ?? "[]");
          setInspectData({ name: container.Names, json: JSON.stringify(parsed, null, 2) });
        } catch {
          setInspectData({ name: container.Names, json: result.stdout ?? "" });
        }
      }
    } catch (e: any) {
      setActionErrors((prev) => ({ ...prev, [key]: e.message }));
    } finally {
      markRunning(key, false);
    }
  }, [sessionId, markRunning, clearActionError]);

  if (!sessionId) {
    return (
      <div style={s.emptyWrap}>
        <span style={s.emptyText}>Connect to a VM to manage Docker containers</span>
      </div>
    );
  }

  return (
    <div style={s.root}>
      {/* Panel header */}
      <div style={s.header}>
        <span className="label-sm">Docker</span>
        <button style={s.iconBtn} onClick={fetchContainers} disabled={loading} title="Refresh containers">
          {loading
            ? <span style={s.spinner} />
            : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            )
          }
        </button>
      </div>

      {/* Fetch error */}
      {fetchError && (
        <div style={s.errorBanner}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{fetchError}</span>
        </div>
      )}

      {/* Inspect panel */}
      {inspectData && (
        <div style={s.inspectPanel}>
          <div style={s.inspectHeader}>
            <span style={s.inspectTitle}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {inspectData.name}
            </span>
            <button style={s.closeBtn} onClick={() => setInspectData(null)}>×</button>
          </div>
          <pre style={s.inspectPre}>{inspectData.json}</pre>
        </div>
      )}

      {/* Empty state */}
      {containers.length === 0 && !loading && !fetchError && (
        <div style={s.emptyWrap}>
          <span style={s.emptyText}>No containers found</span>
        </div>
      )}

      {/* Container list */}
      <div style={s.list}>
        {containers.map((c) => {
          const isRunning = c.State === "running";
          const startKey = `${c.ID}:start`;
          const stopKey = `${c.ID}:stop`;
          const restartKey = `${c.ID}:restart`;
          const inspectKey = `${c.ID}:inspect`;
          const busy = runningActions.has(startKey) || runningActions.has(stopKey)
            || runningActions.has(restartKey) || runningActions.has(inspectKey);
          const rowError = actionErrors[startKey] || actionErrors[stopKey]
            || actionErrors[restartKey] || actionErrors[inspectKey];

          return (
            <div key={c.ID} style={s.row}>
              <div style={s.rowTop}>
                <span style={{ ...s.stateDot, background: isRunning ? "var(--success)" : "var(--text-muted)" }} title={c.State} />
                <span style={s.containerName}>{c.Names}</span>
                <span style={s.containerImage}>{c.Image}</span>
              </div>
              <div style={s.statusText}>{c.Status}</div>
              {rowError && <div style={s.rowError}>{rowError}</div>}
              <div style={s.actions}>
                {!isRunning && (
                  <ActionBtn
                    label="Start"
                    running={runningActions.has(startKey)}
                    disabled={busy}
                    onClick={() => runContainerAction(c, "start")}
                    accent="var(--success)"
                  />
                )}
                {isRunning && (
                  <ActionBtn
                    label="Stop"
                    running={runningActions.has(stopKey)}
                    disabled={busy}
                    onClick={() => runContainerAction(c, "stop")}
                    accent="var(--danger)"
                  />
                )}
                {isRunning && (
                  <ActionBtn
                    label="Restart"
                    running={runningActions.has(restartKey)}
                    disabled={busy}
                    onClick={() => runContainerAction(c, "restart")}
                  />
                )}
                {isRunning && (
                  <ActionBtn
                    label="Logs"
                    running={false}
                    disabled={busy}
                    onClick={() => viewLogs(c)}
                    icon={
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    }
                  />
                )}
                <ActionBtn
                  label="Inspect"
                  running={runningActions.has(inspectKey)}
                  disabled={busy}
                  onClick={() => inspectContainer(c)}
                  icon={
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionBtn({
  label, running, disabled, onClick, accent, icon,
}: {
  label: string;
  running: boolean;
  disabled: boolean;
  onClick: () => void;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      style={{
        ...s.actionBtn,
        ...(accent ? { color: accent, borderColor: `${accent}40` } : {}),
        ...(running ? s.actionBtnBusy : {}),
      }}
      disabled={disabled || running}
      onClick={onClick}
    >
      {running ? <span style={s.spinner} /> : icon}
      {label}
    </button>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    flex: 1,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px 7px",
    flexShrink: 0,
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: 2,
    borderRadius: 4,
    transition: "color 0.1s",
  },
  list: {
    overflowY: "auto",
    flex: 1,
  },
  row: {
    padding: "8px 12px",
    borderBottom: "1px solid var(--border-subtle)",
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  rowTop: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    overflow: "hidden",
  },
  stateDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },
  containerName: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  containerImage: {
    fontSize: 10,
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flexShrink: 0,
    maxWidth: "45%",
  },
  statusText: {
    fontSize: 10,
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)",
  },
  rowError: {
    fontSize: 10,
    color: "var(--danger)",
    fontFamily: "var(--font-mono)",
    wordBreak: "break-all",
  },
  actions: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap",
    marginTop: 1,
  },
  actionBtn: {
    padding: "2px 8px",
    background: "var(--bg-tertiary)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    fontSize: 10,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 4,
    transition: "all 0.1s ease",
    whiteSpace: "nowrap",
  },
  actionBtnBusy: {
    opacity: 0.55,
    cursor: "wait",
  },
  spinner: {
    display: "inline-block",
    width: 8,
    height: 8,
    border: "1.5px solid var(--text-secondary)",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
    flexShrink: 0,
  },
  emptyWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: 24,
  },
  emptyText: {
    fontSize: 11,
    color: "var(--text-muted)",
    textAlign: "center",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    background: "rgba(248,81,73,0.07)",
    color: "var(--danger)",
    fontSize: 10,
    borderBottom: "1px solid rgba(248,81,73,0.15)",
    fontFamily: "var(--font-mono)",
    flexShrink: 0,
  },
  inspectPanel: {
    borderBottom: "1px solid var(--border)",
    maxHeight: 220,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    background: "var(--bg-primary)",
  },
  inspectHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 8px 4px 12px",
    background: "var(--bg-secondary)",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  inspectTitle: {
    fontSize: 10,
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)",
    display: "flex",
    alignItems: "center",
    gap: 5,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    fontSize: 16,
    cursor: "pointer",
    padding: "0 2px",
    lineHeight: 1,
    flexShrink: 0,
  },
  inspectPre: {
    margin: 0,
    padding: "8px 12px",
    fontSize: 10,
    fontFamily: "var(--font-mono)",
    color: "var(--text-primary)",
    overflow: "auto",
    flex: 1,
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    lineHeight: 1.55,
  },
};
