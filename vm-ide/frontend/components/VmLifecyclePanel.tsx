"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { electronSsh, SshConnectParams } from "@/lib/electron";

interface Props {
  sessionId: string | null;
  connInfo: { host: string; username: string } | null;
  lastConnectParams: SshConnectParams | null;
  onConnect: (params: SshConnectParams) => Promise<void>;
  onDisconnect: () => Promise<void>;
}

type LifecycleAction = "reboot" | "shutdown";
type PanelState =
  | "idle"
  | "confirming_reboot"
  | "confirming_shutdown"
  | "executing"
  | "waiting_reconnect"
  | "reconnect_timeout";

const RECONNECT_INTERVAL_MS = 5_000;
const RECONNECT_MAX_MS = 2 * 60 * 1000; // 2 minutes

export default function VmLifecyclePanel({
  sessionId,
  connInfo,
  lastConnectParams,
  onConnect,
  onDisconnect,
}: Props) {
  const [state, setState] = useState<PanelState>("idle");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [reconnectElapsed, setReconnectElapsed] = useState(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectStartRef = useRef<number>(0);
  const unmountedRef = useRef(false);

  useEffect(() => {
    return () => { unmountedRef.current = true; };
  }, []);

  // If session disconnects externally while waiting, reset to idle
  useEffect(() => {
    if (!sessionId && state === "idle") {
      setStatusMsg(null);
    }
  }, [sessionId, state]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const scheduleNextReconnect = useCallback((params: SshConnectParams) => {
    if (unmountedRef.current) return;
    const elapsed = Date.now() - reconnectStartRef.current;
    if (elapsed >= RECONNECT_MAX_MS) {
      setState("reconnect_timeout");
      setStatusMsg("Reconnect timed out after 2 minutes. Use the Reconnect button to retry manually.");
      return;
    }

    setReconnectElapsed(Math.floor(elapsed / 1000));

    reconnectTimerRef.current = setTimeout(async () => {
      if (unmountedRef.current) return;
      try {
        await onConnect(params);
        if (unmountedRef.current) return;
        setState("idle");
        setStatusMsg(null);
      } catch {
        scheduleNextReconnect(params);
      }
    }, RECONNECT_INTERVAL_MS);
  }, [onConnect]);

  const startReconnectPolling = useCallback((params: SshConnectParams) => {
    reconnectStartRef.current = Date.now();
    setReconnectElapsed(0);
    setState("waiting_reconnect");
    setStatusMsg("Waiting for VM to come back online…");
    scheduleNextReconnect(params);
  }, [scheduleNextReconnect]);

  const executeAction = useCallback(async (action: LifecycleAction) => {
    if (!sessionId) return;

    setState("executing");
    setStatusMsg(action === "reboot" ? "Sending reboot command…" : "Sending shutdown command…");

    const command = action === "reboot" ? "sudo reboot" : "sudo shutdown -h now";

    try {
      // Fire the command — connection will drop immediately, so we may get an error/close
      // that is expected. Don't treat a connection-close error as failure.
      await electronSsh.exec(sessionId, command).catch(() => { /* connection drop is expected */ });
    } catch { /* expected */ }

    if (unmountedRef.current) return;

    if (action === "shutdown") {
      await onDisconnect().catch(() => {});
      setState("idle");
      setStatusMsg("VM is shutting down.");
      return;
    }

    // Reboot: disconnect current session and start polling
    await onDisconnect().catch(() => {});

    if (!lastConnectParams) {
      setState("reconnect_timeout");
      setStatusMsg("No connection params saved. Use the Reconnect button to reconnect manually.");
      return;
    }

    startReconnectPolling(lastConnectParams);
  }, [sessionId, lastConnectParams, onDisconnect, startReconnectPolling]);

  const handleConfirm = useCallback((action: LifecycleAction) => {
    setState(action === "reboot" ? "confirming_reboot" : "confirming_shutdown");
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setState("idle");
    setStatusMsg(null);
  }, []);

  const handleProceed = useCallback((action: LifecycleAction) => {
    executeAction(action);
  }, [executeAction]);

  const handleManualReconnect = useCallback(async () => {
    clearReconnectTimer();
    if (!lastConnectParams) return;
    setState("executing");
    setStatusMsg("Reconnecting…");
    try {
      await onConnect(lastConnectParams);
      if (!unmountedRef.current) { setState("idle"); setStatusMsg(null); }
    } catch (e: any) {
      if (!unmountedRef.current) { setState("idle"); setStatusMsg(`Reconnect failed: ${e.message}`); }
    }
  }, [lastConnectParams, onConnect, clearReconnectTimer]);

  // Cleanup timers on unmount
  useEffect(() => () => clearReconnectTimer(), [clearReconnectTimer]);

  const isConnected = !!sessionId && !!connInfo;
  const isBusy = state === "executing" || state === "waiting_reconnect";

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <span className="label-sm">VM Controls</span>
        {isConnected && (
          <span style={s.connPill}>
            <span style={s.connDot} />
            {connInfo!.host}
          </span>
        )}
      </div>

      {/* Status message */}
      {statusMsg && (
        <div style={{
          ...s.statusBanner,
          ...(state === "reconnect_timeout" ? s.statusBannerError : {}),
        }}>
          {isBusy && state === "waiting_reconnect" && (
            <span style={s.spinner} />
          )}
          <span style={{ flex: 1 }}>{statusMsg}</span>
          {state === "waiting_reconnect" && (
            <span style={s.elapsed}>{reconnectElapsed}s</span>
          )}
        </div>
      )}

      {/* Confirm dialog */}
      {(state === "confirming_reboot" || state === "confirming_shutdown") && (
        <div style={s.confirmBox}>
          <div style={s.confirmIcon}>
            {state === "confirming_reboot"
              ? <RebootIcon size={20} />
              : <ShutdownIcon size={20} />
            }
          </div>
          <div style={s.confirmTitle}>
            {state === "confirming_reboot" ? "Reboot VM?" : "Shut down VM?"}
          </div>
          <div style={s.confirmDesc}>
            {state === "confirming_reboot"
              ? "This will reboot the VM. Your SSH connection will drop and automatically reconnect when the VM comes back online."
              : "This will power off the VM. You will need to start it manually to reconnect."
            }
          </div>
          <div style={s.confirmActions}>
            <button
              style={{ ...s.confirmBtn, ...(state === "confirming_shutdown" ? s.confirmBtnDanger : s.confirmBtnWarn) }}
              onClick={() => handleProceed(state === "confirming_reboot" ? "reboot" : "shutdown")}
            >
              {state === "confirming_reboot" ? "Reboot" : "Shut Down"}
            </button>
            <button style={s.cancelBtn} onClick={handleCancelConfirm}>Cancel</button>
          </div>
        </div>
      )}

      {/* Control buttons */}
      {state !== "confirming_reboot" && state !== "confirming_shutdown" && (
        <div style={s.controls}>
          <ControlButton
            label="Reboot"
            desc="Reboot the VM and auto-reconnect"
            disabled={!isConnected || isBusy}
            loading={state === "executing" || (state === "waiting_reconnect")}
            variant="warn"
            icon={<RebootIcon size={14} />}
            onClick={() => handleConfirm("reboot")}
          />
          <ControlButton
            label="Shut Down"
            desc="Power off the VM"
            disabled={!isConnected || isBusy}
            loading={false}
            variant="danger"
            icon={<ShutdownIcon size={14} />}
            onClick={() => handleConfirm("shutdown")}
          />
          <ControlButton
            label="Reconnect SSH"
            desc={lastConnectParams ? `Reconnect to ${lastConnectParams.host}` : "No saved connection"}
            disabled={isBusy || !lastConnectParams || isConnected}
            loading={state === "executing"}
            variant="default"
            icon={<ReconnectIcon size={14} />}
            onClick={handleManualReconnect}
          />
        </div>
      )}

      {/* No connection hint */}
      {!isConnected && state === "idle" && (
        <div style={s.hint}>Connect to a VM via the SSH bar to enable lifecycle controls.</div>
      )}
    </div>
  );
}

function ControlButton({
  label, desc, disabled, loading, variant, icon, onClick,
}: {
  label: string;
  desc: string;
  disabled: boolean;
  loading: boolean;
  variant: "default" | "warn" | "danger";
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const accentMap: Record<string, string> = {
    default: "var(--accent)",
    warn: "var(--warning, #f0c040)",
    danger: "var(--danger)",
  };
  const bgMap: Record<string, string> = {
    default: "rgba(68,147,248,0.07)",
    warn: "rgba(240,192,64,0.07)",
    danger: "rgba(248,81,73,0.07)",
  };
  const borderMap: Record<string, string> = {
    default: "rgba(68,147,248,0.18)",
    warn: "rgba(240,192,64,0.18)",
    danger: "rgba(248,81,73,0.18)",
  };
  return (
    <button
      style={{
        ...s.ctrlBtn,
        background: bgMap[variant],
        color: accentMap[variant],
        border: `1px solid ${borderMap[variant]}`,
        ...(disabled ? s.ctrlBtnDisabled : {}),
      }}
      disabled={disabled || loading}
      onClick={onClick}
    >
      <span style={s.ctrlBtnLeft}>
        {loading ? <span style={{ ...s.spinner, borderTopColor: accentMap[variant] }} /> : icon}
        <span style={s.ctrlBtnLabel}>{label}</span>
      </span>
      <span style={s.ctrlBtnDesc}>{desc}</span>
    </button>
  );
}

function RebootIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function ShutdownIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}

function ReconnectIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
    </svg>
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
  connPill: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 10,
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)",
    background: "var(--bg-tertiary)",
    padding: "2px 6px",
    borderRadius: 4,
    maxWidth: 130,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  connDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "var(--success)",
    flexShrink: 0,
  },
  statusBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    background: "rgba(68,147,248,0.07)",
    color: "var(--accent)",
    fontSize: 11,
    borderBottom: "1px solid rgba(68,147,248,0.15)",
    fontFamily: "var(--font-sans)",
    flexShrink: 0,
  },
  statusBannerError: {
    background: "rgba(248,81,73,0.07)",
    color: "var(--danger)",
    borderBottom: "1px solid rgba(248,81,73,0.15)",
  },
  elapsed: {
    fontSize: 10,
    opacity: 0.6,
    fontFamily: "var(--font-mono)",
    flexShrink: 0,
  },
  spinner: {
    display: "inline-block",
    width: 12,
    height: 12,
    border: "2px solid rgba(255,255,255,0.15)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    flexShrink: 0,
  },
  confirmBox: {
    margin: "12px",
    padding: "16px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    flexShrink: 0,
  },
  confirmIcon: {
    color: "var(--warning, #f0c040)",
    display: "flex",
    alignItems: "center",
  },
  confirmTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-bright)",
    fontFamily: "var(--font-sans)",
  },
  confirmDesc: {
    fontSize: 11,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    fontFamily: "var(--font-sans)",
  },
  confirmActions: {
    display: "flex",
    gap: 8,
    marginTop: 2,
  },
  confirmBtn: {
    flex: 1,
    padding: "7px 0",
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
  },
  confirmBtnWarn: {
    background: "rgba(240,192,64,0.15)",
    color: "var(--warning, #f0c040)",
  },
  confirmBtnDanger: {
    background: "rgba(248,81,73,0.15)",
    color: "var(--danger)",
  },
  cancelBtn: {
    flex: 1,
    padding: "7px 0",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    color: "var(--text-secondary)",
    fontFamily: "var(--font-sans)",
  },
  controls: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "12px",
  },
  ctrlBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderRadius: 8,
    cursor: "pointer",
    transition: "opacity 0.1s",
    gap: 8,
  },
  ctrlBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  ctrlBtnLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  ctrlBtnLabel: {
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "var(--font-sans)",
  },
  ctrlBtnDesc: {
    fontSize: 10,
    opacity: 0.65,
    fontFamily: "var(--font-sans)",
    textAlign: "right",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  hint: {
    fontSize: 11,
    color: "var(--text-muted)",
    padding: "0 12px 12px",
    lineHeight: 1.55,
    fontFamily: "var(--font-sans)",
  },
};
