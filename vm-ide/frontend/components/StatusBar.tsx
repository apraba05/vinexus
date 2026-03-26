"use client";
import React from "react";

interface Props {
  sessionId: string | null;
  host?: string;
  username?: string;
  activeFile: string | null;
  openFileCount: number;
  dirtyFileCount: number;
  appVersion?: string | null;
}

export default function StatusBar({
  sessionId,
  host,
  username,
  activeFile,
  openFileCount,
  dirtyFileCount,
  appVersion,
}: Props) {
  return (
    <div style={styles.bar}>
      {/* Left: connection status */}
      <div style={styles.left}>
        <span style={{
          ...styles.connPill,
          background: sessionId ? "rgba(63, 255, 162, 0.12)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${sessionId ? "rgba(63, 255, 162, 0.22)" : "rgba(255,255,255,0.06)"}`,
          color: sessionId ? "var(--accent)" : "var(--text-secondary)",
        }}>
          <span style={{
            ...styles.connDot,
            background: sessionId ? "var(--accent)" : "var(--text-muted)",
            boxShadow: sessionId ? "0 0 5px var(--accent)" : "none",
          }} />
          {sessionId
            ? `${username || ""}@${host || "connected"}`
            : "Not connected"}
        </span>

        {openFileCount > 0 && (
          <span style={styles.item}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {openFileCount} open
            {dirtyFileCount > 0 && (
              <span style={{ color: "var(--warning)", marginLeft: 3 }}>
                · {dirtyFileCount} unsaved
              </span>
            )}
          </span>
        )}
      </div>

      {/* Right: language + shortcuts */}
      <div style={styles.right}>
        {appVersion && (
          <span style={styles.versionBadge}>
            v{appVersion}
          </span>
        )}
        {activeFile && (
          <span style={styles.langBadge}>
            {getLanguageLabel(activeFile)}
          </span>
        )}
        <span style={styles.shortcutsHint}>
          <kbd style={styles.kbd}>⌘S</kbd>
          <span style={styles.kbdLabel}>save</span>
          <span style={styles.kbdSep} />
          <kbd style={styles.kbd}>⌘⇧D</kbd>
          <span style={styles.kbdLabel}>deploy</span>
          <span style={styles.kbdSep} />
          <kbd style={styles.kbd}>⌘⇧L</kbd>
          <span style={styles.kbdLabel}>logs</span>
        </span>
      </div>
    </div>
  );
}

function getLanguageLabel(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    js: "JavaScript", jsx: "JSX", ts: "TypeScript", tsx: "TSX",
    py: "Python", rb: "Ruby", go: "Go", rs: "Rust",
    java: "Java", json: "JSON", yaml: "YAML", yml: "YAML",
    html: "HTML", css: "CSS", md: "Markdown", sh: "Shell",
    bash: "Shell", conf: "Config", toml: "TOML", xml: "XML", sql: "SQL",
  };
  return map[ext] || ext.toUpperCase() || "Plain Text";
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 10px",
    height: 22,
    background: "var(--bg-elevated)",
    borderTop: "1px solid var(--border)",
    fontSize: 11,
    color: "var(--text-secondary)",
    flexShrink: 0,
    gap: 8,
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  connPill: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "1px 8px",
    borderRadius: 100,
    fontSize: 10,
    fontWeight: 600,
    fontFamily: "var(--font-mono)",
    whiteSpace: "nowrap" as const,
  },
  connDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    flexShrink: 0,
    animation: "pulse 2s ease-in-out infinite",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap" as const,
    color: "var(--text-secondary)",
  },
  langBadge: {
    padding: "1px 7px",
    background: "rgba(79, 142, 247, 0.1)",
    color: "var(--accent-blue)",
    border: "1px solid rgba(79, 142, 247, 0.18)",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.03em",
  },
  versionBadge: {
    padding: "1px 7px",
    background: "rgba(124, 58, 237, 0.12)",
    color: "var(--accent)",
    border: "1px solid rgba(124, 58, 237, 0.2)",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.03em",
    fontFamily: "var(--font-mono)",
  },
  shortcutsHint: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    opacity: 0.7,
  },
  kbd: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0 4px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 3,
    fontSize: 9,
    fontFamily: "var(--font-mono)",
    lineHeight: "14px",
    color: "var(--text-primary)",
  },
  kbdLabel: {
    fontSize: 10,
    color: "var(--text-muted)",
  },
  kbdSep: {
    width: 1,
    height: 10,
    background: "var(--border)",
    margin: "0 4px",
  },
};
