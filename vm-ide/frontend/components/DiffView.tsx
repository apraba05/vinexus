"use client";
import React, { useEffect, useRef } from "react";
import { DiffEditor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

interface Props {
  originalContent: string;
  modifiedContent: string;
  filePath: string;
  additions: number;
  deletions: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DiffView({
  originalContent,
  modifiedContent,
  filePath,
  additions,
  deletions,
  onConfirm,
  onCancel,
  loading = false,
}: Props) {
  const diffRef = useRef<editor.IStandaloneDiffEditor | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        onConfirm();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, onConfirm]);

  const fileName = filePath.split("/").pop() || filePath;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.7 }}
            >
              <path d="M12 3v18M3 12h18" />
            </svg>
            <span style={styles.title}>Review Changes</span>
            <span style={styles.fileName}>{fileName}</span>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.statAdd}>+{additions}</span>
            <span style={styles.statDel}>-{deletions}</span>
          </div>
        </div>

        {/* Diff Editor */}
        <div style={styles.diffArea}>
          <DiffEditor
            original={originalContent}
            modified={modifiedContent}
            language={getLanguageFromPath(filePath)}
            theme="vs-dark"
            onMount={(editor) => {
              diffRef.current = editor;
            }}
            options={{
              readOnly: true,
              renderSideBySide: true,
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              renderOverviewRuler: false,
              diffWordWrap: "on",
            }}
          />
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.hint}>
            Esc to cancel &middot; Cmd+Enter to save
          </span>
          <div style={styles.footerButtons}>
            <button style={styles.cancelBtn} onClick={onCancel}>
              Cancel
            </button>
            <button
              style={styles.confirmBtn}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    html: "html",
    css: "css",
    sh: "shell",
    bash: "shell",
    md: "markdown",
    conf: "ini",
    ini: "ini",
    toml: "ini",
    sql: "sql",
    xml: "xml",
    go: "go",
    rs: "rust",
    rb: "ruby",
    java: "java",
    dockerfile: "dockerfile",
  };
  return map[ext] || "plaintext";
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.15s ease",
  },
  modal: {
    width: "90vw",
    height: "80vh",
    maxWidth: 1400,
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "var(--bg-secondary)",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  fileName: {
    fontSize: 12,
    color: "var(--text-secondary)",
    padding: "2px 8px",
    background: "var(--bg-tertiary)",
    borderRadius: 4,
  },
  statAdd: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--success)",
    fontFamily: "monospace",
  },
  statDel: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--danger)",
    fontFamily: "monospace",
  },
  diffArea: {
    flex: 1,
    overflow: "hidden",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    background: "var(--bg-secondary)",
    borderTop: "1px solid var(--border)",
    flexShrink: 0,
  },
  hint: {
    fontSize: 11,
    color: "var(--text-secondary)",
    opacity: 0.6,
  },
  footerButtons: {
    display: "flex",
    gap: 8,
  },
  cancelBtn: {
    padding: "6px 16px",
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
  },
  confirmBtn: {
    padding: "6px 16px",
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
};
