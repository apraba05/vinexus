"use client";
/**
 * components/SshBar.tsx
 *
 * Vela Desktop — SSH Connection Bar
 *
 * The primary VM access point, pinned at the top of the IDE directly below
 * the native menu bar. Always visible, fixed 48px height, never collapsible.
 *
 * Features:
 *   - Displays connected VMs as pill badges with animated status dots
 *   - "+ New Connection" expands inline connection form (no modal)
 *   - Auth methods: Password, Private Key, AWS SSM
 *   - Right-click context menu on VM badges: Disconnect, Rename, Copy IP, Open Terminal
 *   - Clicking a VM badge switches active VM context
 */

import React, { useState, useCallback, useRef, useEffect } from "react";

export type AuthMethod = "password" | "privateKey" | "awsSsm";
export type SessionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface VmSession {
  id: string;
  label: string;
  host: string;
  username: string;
  port: number;
  status: SessionStatus;
}

interface SshBarProps {
  sessions: VmSession[];
  activeSessionId: string | null;
  onSessionSelect: (id: string) => void;
  onConnect: (params: {
    host: string;
    port: number;
    username: string;
    authMethod: AuthMethod;
    password?: string;
    privateKey?: string;
    label?: string;
  }) => Promise<void>;
  onDisconnect: (id: string) => void;
  onRename: (id: string, newLabel: string) => void;
  onOpenTerminal: (id: string) => void;
  isConnecting: boolean;
}

// ─── Status Dot ───────────────────────────────────────────────────────────────
const StatusDot = ({ status }: { status: SessionStatus }) => {
  const colors: Record<SessionStatus, string> = {
    connected: "#22c55e",
    connecting: "#f59e0b",
    disconnected: "#ef4444",
    error: "#ef4444",
  };
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        flexShrink: 0,
        background: colors[status],
        boxShadow: status === "connected" ? `0 0 6px ${colors.connected}80` : "none",
        animation: status === "connecting" ? "pulse 1s ease-in-out infinite" : "none",
        display: "inline-block",
      }}
    />
  );
};

// ─── Context Menu ─────────────────────────────────────────────────────────────
interface CtxMenu {
  x: number;
  y: number;
  sessionId: string;
}

export default function SshBar({
  sessions,
  activeSessionId,
  onSessionSelect,
  onConnect,
  onDisconnect,
  onRename,
  onOpenTerminal,
  isConnecting,
}: SshBarProps) {
  const [showForm, setShowForm] = useState(false);
  const [host, setHost] = useState("");
  const [port, setPort] = useState("22");
  const [username, setUsername] = useState("");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [password, setPassword] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [label, setLabel] = useState("");
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const formRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) {
        setCtxMenu(null);
      }
    }
    if (ctxMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ctxMenu]);

  const handleConnect = useCallback(async () => {
    if (!host.trim() || !username.trim()) return;
    await onConnect({
      host: host.trim(),
      port: parseInt(port, 10) || 22,
      username: username.trim(),
      authMethod,
      password: authMethod === "password" ? password : undefined,
      privateKey: authMethod === "privateKey" ? privateKey : undefined,
      label: label.trim() || undefined,
    });
    // Reset form on success
    setHost("");
    setPort("22");
    setUsername("");
    setPassword("");
    setPrivateKey("");
    setLabel("");
    setShowForm(false);
  }, [host, port, username, authMethod, password, privateKey, label, onConnect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleConnect();
      if (e.key === "Escape") setShowForm(false);
    },
    [handleConnect]
  );

  const handleBadgeRightClick = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, sessionId });
  };

  const startRename = (id: string) => {
    const s = sessions.find((s) => s.id === id);
    setRenameValue(s?.label || "");
    setRenamingId(id);
    setCtxMenu(null);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const copyIp = (id: string) => {
    const s = sessions.find((s) => s.id === id);
    if (s) navigator.clipboard.writeText(s.host).catch(() => {});
    setCtxMenu(null);
  };

  return (
    <div style={styles.bar}>
      {/* ── VM Badge pills ──────────────────────────────────────────────── */}
      <div style={styles.badgeRow}>
        {sessions.map((s) => (
          <div
            key={s.id}
            style={{
              ...styles.badge,
              ...(s.id === activeSessionId ? styles.badgeActive : {}),
            }}
            onClick={() => onSessionSelect(s.id)}
            onContextMenu={(e) => handleBadgeRightClick(e, s.id)}
            title={`${s.username}@${s.host}:${s.port}\nRight-click for options`}
          >
            <StatusDot status={s.status} />
            {renamingId === s.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setRenamingId(null);
                }}
                style={styles.renameInput}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span style={styles.badgeLabel}>{s.label}</span>
            )}
          </div>
        ))}

        {/* ── + New Connection button ──────────────────────────────────── */}
        <button
          style={{
            ...styles.newBtn,
            ...(showForm ? styles.newBtnActive : {}),
          }}
          onClick={() => setShowForm((v) => !v)}
          title="New SSH Connection"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Connection
        </button>
      </div>

      {/* ── Inline Connection Form ───────────────────────────────────────── */}
      {showForm && (
        <div style={styles.formRow} ref={formRef}>
          <input
            placeholder="Host / IP"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            onKeyDown={handleKeyDown}
            style={styles.input}
            autoFocus
          />
          <input
            placeholder="Port"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ ...styles.input, width: 56 }}
          />
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            style={styles.input}
          />
          <select
            value={authMethod}
            onChange={(e) => setAuthMethod(e.target.value as AuthMethod)}
            style={styles.select}
          >
            <option value="password">Password</option>
            <option value="privateKey">Private Key</option>
            <option value="awsSsm">AWS SSM</option>
          </select>

          {authMethod === "password" && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              style={styles.input}
            />
          )}
          {authMethod === "privateKey" && (
            <textarea
              placeholder="Paste private key (PEM)…"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              style={{ ...styles.input, height: 32, resize: "none", fontFamily: "var(--font-mono)", fontSize: 10 }}
            />
          )}
          {authMethod === "awsSsm" && (
            <span style={{ fontSize: 11, color: "var(--text-secondary)", alignSelf: "center" }}>
              AWS SSM — no open port needed
            </span>
          )}

          <input
            placeholder="Label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ ...styles.input, width: 110 }}
          />

          <button
            style={{
              ...styles.connectBtn,
              ...(isConnecting ? styles.connectBtnLoading : {}),
            }}
            onClick={handleConnect}
            disabled={isConnecting || !host.trim() || !username.trim()}
          >
            {isConnecting ? (
              <>
                <span style={styles.spinner} />
                Connecting…
              </>
            ) : (
              "Connect"
            )}
          </button>
          <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>✕</button>
        </div>
      )}

      {/* ── Right-click Context Menu ─────────────────────────────────────── */}
      {ctxMenu && (
        <div
          ref={ctxRef}
          style={{ ...styles.ctxMenu, left: ctxMenu.x, top: ctxMenu.y }}
        >
          {(() => {
            const s = sessions.find((s) => s.id === ctxMenu.sessionId);
            return (
              <>
                <button style={styles.ctxItem} onClick={() => { onOpenTerminal(ctxMenu.sessionId); setCtxMenu(null); }}>
                  Open Terminal
                </button>
                <button style={styles.ctxItem} onClick={() => startRename(ctxMenu.sessionId)}>
                  Rename
                </button>
                <button style={styles.ctxItem} onClick={() => copyIp(ctxMenu.sessionId)}>
                  Copy IP
                </button>
                <div style={styles.ctxDivider} />
                <button style={{ ...styles.ctxItem, color: "var(--danger)" }} onClick={() => { onDisconnect(ctxMenu.sessionId); setCtxMenu(null); }}>
                  Disconnect
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  bar: {
    height: 48,
    minHeight: 48,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 0,
    background: "var(--bg-elevated)",
    borderBottom: "1px solid var(--border)",
    padding: "0 12px",
    overflow: "visible",
    position: "relative",
    zIndex: 100,
  },
  badgeRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 10px 4px 8px",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 20,
    cursor: "pointer",
    fontSize: 12,
    color: "var(--text-secondary)",
    userSelect: "none",
    transition: "border-color 0.15s, color 0.15s",
  },
  badgeActive: {
    border: "1px solid var(--accent)",
    color: "var(--text-bright)",
    background: "rgba(63, 255, 162, 0.06)",
  },
  badgeLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    maxWidth: 120,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  renameInput: {
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--text-bright)",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    width: 90,
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 10px",
    background: "transparent",
    border: "1px dashed var(--border)",
    borderRadius: 20,
    cursor: "pointer",
    fontSize: 11,
    color: "var(--text-secondary)",
    fontWeight: 500,
    transition: "border-color 0.15s, color 0.15s",
  },
  newBtnActive: {
    borderColor: "var(--accent)",
    color: "var(--accent)",
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginLeft: 12,
    flex: 1,
    overflow: "visible",
  },
  input: {
    height: 28,
    padding: "0 8px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text-bright)",
    fontSize: 12,
    outline: "none",
    minWidth: 80,
    flex: 1,
    maxWidth: 160,
  },
  select: {
    height: 28,
    padding: "0 6px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text-bright)",
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
  },
  connectBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    height: 28,
    padding: "0 14px",
    background: "var(--accent)",
    border: "none",
    borderRadius: 6,
    color: "#000",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
  },
  connectBtnLoading: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  cancelBtn: {
    height: 28,
    width: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text-secondary)",
    fontSize: 13,
    cursor: "pointer",
    flexShrink: 0,
  },
  spinner: {
    width: 10,
    height: 10,
    border: "2px solid rgba(0,0,0,0.3)",
    borderTopColor: "#000",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.6s linear infinite",
  },
  // ── Context Menu ───────────────────────────────────────────────────────────
  ctxMenu: {
    position: "fixed",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "4px 0",
    zIndex: 9999,
    minWidth: 150,
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
  },
  ctxItem: {
    display: "block",
    width: "100%",
    padding: "7px 14px",
    background: "transparent",
    border: "none",
    color: "var(--text-bright)",
    fontSize: 12,
    textAlign: "left",
    cursor: "pointer",
  },
  ctxDivider: {
    height: 1,
    background: "var(--border)",
    margin: "3px 0",
  },
};
