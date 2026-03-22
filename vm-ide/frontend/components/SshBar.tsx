"use client";
/**
 * components/SshBar.tsx
 *
 * Vinexus Desktop — SSH Connection Bar
 * Matches the "Precision Architect" design language.
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

const StatusDot = ({ status }: { status: SessionStatus }) => {
  const colors: Record<SessionStatus, string> = {
    connected: "#22c55e",
    connecting: "#f59e0b",
    disconnected: "#ef4444",
    error: "#ef4444",
  };
  return (
    <span style={{
      width: 6,
      height: 6,
      borderRadius: "50%",
      flexShrink: 0,
      background: colors[status],
      boxShadow: status === "connected" ? `0 0 5px ${colors.connected}80` : status === "disconnected" || status === "error" ? `0 0 5px #ef444480` : "none",
      animation: status === "connecting" ? "pulse 1s ease-in-out infinite" : "none",
      display: "inline-block",
    }} />
  );
};

interface CtxMenu { x: number; y: number; sessionId: string; }

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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) setCtxMenu(null);
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
    setHost(""); setPort("22"); setUsername(""); setPassword(""); setPrivateKey(""); setLabel("");
    setShowForm(false);
  }, [host, port, username, authMethod, password, privateKey, label, onConnect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConnect();
    if (e.key === "Escape") setShowForm(false);
  }, [handleConnect]);

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
    if (renamingId && renameValue.trim()) onRename(renamingId, renameValue.trim());
    setRenamingId(null);
  };

  const copyIp = (id: string) => {
    const s = sessions.find((s) => s.id === id);
    if (s) navigator.clipboard.writeText(s.host).catch(() => {});
    setCtxMenu(null);
  };

  return (
    <div style={styles.bar}>
      {/* Badge pills row */}
      <div style={styles.badgeRow}>
        {/* + New Connection */}
        <button
          style={{ ...styles.newBtn, ...(showForm ? styles.newBtnActive : {}) }}
          onClick={() => setShowForm((v) => !v)}
          title="New SSH Connection"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Connection
        </button>

        {sessions.length === 0 && !showForm && (
          <span style={styles.emptyHint}>
            No active connections — click New Connection to get started
          </span>
        )}

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
            <button
              style={styles.badgeClose}
              onClick={(e) => { e.stopPropagation(); onDisconnect(s.id); }}
              title="Disconnect"
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Inline connection form */}
      {showForm && (
        <div style={styles.formRow} ref={formRef}>
          <label style={styles.fieldLabel}>HOST</label>
          <input placeholder="192.168.1.1" value={host} onChange={(e) => setHost(e.target.value)} onKeyDown={handleKeyDown} style={styles.input} autoFocus />

          <label style={styles.fieldLabel}>PORT</label>
          <input placeholder="22" value={port} onChange={(e) => setPort(e.target.value)} onKeyDown={handleKeyDown} style={{ ...styles.input, width: 50, flex: "none" }} />

          <label style={styles.fieldLabel}>USER</label>
          <input placeholder="ubuntu" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={handleKeyDown} style={styles.input} />

          <label style={styles.fieldLabel}>AUTH</label>
          <select value={authMethod} onChange={(e) => setAuthMethod(e.target.value as AuthMethod)} style={styles.select}>
            <option value="password">Password</option>
            <option value="privateKey">Private Key</option>
            <option value="awsSsm">AWS SSM</option>
          </select>

          {authMethod === "password" && (
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} style={styles.input} />
          )}
          {authMethod === "privateKey" && (
            <textarea placeholder="Paste private key…" value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} style={{ ...styles.input, height: 28, resize: "none", fontFamily: "var(--font-mono)", fontSize: 10 }} />
          )}
          {authMethod === "awsSsm" && (
            <span style={{ fontSize: 11, color: "var(--text-muted)", alignSelf: "center", whiteSpace: "nowrap" }}>No open port needed</span>
          )}

          <button style={styles.browseBtn} type="button">Browse…</button>

          <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
          <button
            style={{ ...styles.connectBtn, opacity: (isConnecting || !host.trim() || !username.trim()) ? 0.6 : 1 }}
            onClick={handleConnect}
            disabled={isConnecting || !host.trim() || !username.trim()}
          >
            {isConnecting ? (
              <><span style={styles.spinner} /> Connecting…</>
            ) : (
              <>Connect →</>
            )}
          </button>
        </div>
      )}

      {/* Right-click context menu */}
      {ctxMenu && (
        <div ref={ctxRef} style={{ ...styles.ctxMenu, left: ctxMenu.x, top: ctxMenu.y }}>
          <button className="nav-item" style={{ ...styles.ctxItem }} onClick={() => { onOpenTerminal(ctxMenu.sessionId); setCtxMenu(null); }}>
            Open Terminal
          </button>
          <button className="nav-item" style={{ ...styles.ctxItem }} onClick={() => startRename(ctxMenu.sessionId)}>
            Rename
          </button>
          <button className="nav-item" style={{ ...styles.ctxItem }} onClick={() => copyIp(ctxMenu.sessionId)}>
            Copy IP
          </button>
          <div style={styles.ctxDivider} />
          <button className="nav-item" style={{ ...styles.ctxItem, color: "var(--danger)" }} onClick={() => { onDisconnect(ctxMenu.sessionId); setCtxMenu(null); }}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    minHeight: 42,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 0,
    background: "var(--bg-secondary)",
    borderBottom: "1px solid var(--border)",
    padding: "0 12px",
    overflow: "visible",
    position: "relative",
    zIndex: 100,
    flexWrap: "wrap" as const,
  },
  badgeRow: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
    padding: "5px 0",
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 11px",
    background: "var(--accent)",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    color: "#ffffff",
    transition: "background 0.15s",
    fontFamily: "var(--font-sans)",
  },
  newBtnActive: {
    background: "var(--accent-hover)",
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 8px 3px 9px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    color: "var(--text-secondary)",
    userSelect: "none",
    transition: "border-color 0.12s, background 0.12s",
  },
  badgeActive: {
    border: "1px solid rgba(0, 83, 219, 0.4)",
    color: "var(--text-bright)",
    background: "var(--accent-surface)",
  },
  badgeLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    maxWidth: 110,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  badgeClose: {
    width: 16,
    height: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "var(--text-muted)",
    borderRadius: 3,
    padding: 0,
    flexShrink: 0,
    transition: "color 0.1s, background 0.1s",
  },
  renameInput: {
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--text-bright)",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    width: 80,
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 0 5px 10px",
    flex: 1,
    flexWrap: "wrap" as const,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.07em",
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    flexShrink: 0,
  },
  input: {
    height: 26,
    padding: "0 8px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 5,
    color: "var(--text-bright)",
    fontSize: 12,
    outline: "none",
    minWidth: 80,
    flex: 1,
    maxWidth: 150,
    transition: "border-color 0.12s",
    fontFamily: "var(--font-sans)",
  },
  select: {
    height: 26,
    padding: "0 6px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 5,
    color: "var(--text-primary)",
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
  },
  browseBtn: {
    height: 26,
    padding: "0 10px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 5,
    color: "var(--text-secondary)",
    fontSize: 12,
    cursor: "pointer",
    flexShrink: 0,
    fontFamily: "var(--font-sans)",
    transition: "background 0.12s",
  },
  cancelBtn: {
    height: 26,
    padding: "0 10px",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 5,
    color: "var(--text-secondary)",
    fontSize: 12,
    cursor: "pointer",
    flexShrink: 0,
    fontFamily: "var(--font-sans)",
    transition: "background 0.12s",
  },
  connectBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    height: 26,
    padding: "0 13px",
    background: "var(--accent)",
    border: "none",
    borderRadius: 5,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
    fontFamily: "var(--font-sans)",
    transition: "background 0.12s",
  },
  spinner: {
    width: 10,
    height: 10,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.6s linear infinite",
  },
  ctxMenu: {
    position: "fixed",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "4px 0",
    zIndex: 9999,
    minWidth: 150,
    boxShadow: "0 8px 24px rgba(25, 49, 93, 0.1)",
  },
  ctxItem: {
    display: "block",
    width: "100%",
    padding: "6px 14px",
    background: "transparent",
    border: "none",
    color: "var(--text-primary)",
    fontSize: 12,
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    borderRadius: 0,
  },
  ctxDivider: {
    height: 1,
    background: "var(--border)",
    margin: "3px 0",
  },
  emptyHint: {
    fontSize: 12,
    color: "var(--text-muted)",
    marginLeft: 8,
  },
};
