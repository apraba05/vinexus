"use client";
import React from "react";

interface Props {
  sessionId: string | null;
  host?: string;
  username?: string;
  activeFile: string | null;
  openFileCount: number;
  dirtyFileCount: number;
}

export default function StatusBar({
  sessionId,
  host,
  username,
  activeFile,
  openFileCount,
  dirtyFileCount,
}: Props) {
  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        {/* Connection status */}
        <span style={styles.item}>
          <span
            style={{
              ...styles.dot,
              background: sessionId ? "var(--success)" : "var(--text-secondary)",
            }}
          />
          {sessionId
            ? `${username || ""}@${host || "connected"}`
            : "Disconnected"}
        </span>

        {/* Open files */}
        {openFileCount > 0 && (
          <span style={styles.item}>
            {openFileCount} file{openFileCount !== 1 ? "s" : ""} open
            {dirtyFileCount > 0 && (
              <span style={{ color: "var(--warning)" }}>
                {" "}({dirtyFileCount} unsaved)
              </span>
            )}
          </span>
        )}
      </div>
      <div style={styles.right}>
        {/* Active file language */}
        {activeFile && (
          <span style={styles.item}>
            {getLanguageLabel(activeFile)}
          </span>
        )}

        {/* Shortcuts hint */}
        <span style={styles.item}>
          <kbd style={styles.kbd}>Ctrl+S</kbd> Save
          <kbd style={styles.kbd}>Ctrl+Shift+D</kbd> Deploy
          <kbd style={styles.kbd}>Ctrl+Shift+L</kbd> Logs
        </span>
      </div>
    </div>
  );
}

function getLanguageLabel(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    js: "JavaScript",
    jsx: "JSX",
    ts: "TypeScript",
    tsx: "TSX",
    py: "Python",
    rb: "Ruby",
    go: "Go",
    rs: "Rust",
    java: "Java",
    json: "JSON",
    yaml: "YAML",
    yml: "YAML",
    html: "HTML",
    css: "CSS",
    md: "Markdown",
    sh: "Shell",
    bash: "Shell",
    conf: "Config",
    toml: "TOML",
    xml: "XML",
    sql: "SQL",
  };
  return map[ext] || ext.toUpperCase() || "Plain Text";
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "2px 12px",
    background: "var(--bg-tertiary)",
    borderTop: "1px solid var(--border)",
    fontSize: 11,
    color: "var(--text-secondary)",
    flexShrink: 0,
    gap: 8,
    height: 24,
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },
  kbd: {
    display: "inline-block",
    padding: "0 4px",
    marginLeft: 6,
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: 3,
    fontSize: 9,
    fontFamily: "monospace",
    lineHeight: "14px",
  },
};
