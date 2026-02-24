"use client";
import React, { useRef, useCallback } from "react";
import MonacoEditor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { usePlan } from "@/contexts/PlanContext";

interface OpenFile {
  path: string;
  content: string;
  dirty: boolean;
}

interface Props {
  openFiles: OpenFile[];
  activeFile: string | null;
  onSetActive: (path: string) => void;
  onContentChange: (path: string, content: string) => void;
  onSave: (path: string) => void;
  onCloseFile: (path: string) => void;
  onExplain?: (path: string, content: string) => void;
  aiLoading?: boolean;
}

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    php: "php",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    less: "less",
    json: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    dockerfile: "dockerfile",
    toml: "ini",
    ini: "ini",
    conf: "ini",
    env: "ini",
    txt: "plaintext",
    log: "plaintext",
  };
  return map[ext] || "plaintext";
}

export default function Editor({
  openFiles,
  activeFile,
  onSetActive,
  onContentChange,
  onSave,
  onCloseFile,
  onExplain,
  aiLoading = false,
}: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const { features } = usePlan();

  const activeFileObj = openFiles.find((f) => f.path === activeFile);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;

    editor.addCommand(
      // eslint-disable-next-line no-bitwise
      2048 | 49, // KeyMod.CtrlCmd | KeyCode.KeyS
      () => {
        if (activeFile) onSave(activeFile);
      }
    );
  };

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (activeFile && value !== undefined) {
        onContentChange(activeFile, value);
      }
    },
    [activeFile, onContentChange]
  );

  if (openFiles.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyContent}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.15, marginBottom: 16 }}>
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
          <div style={styles.emptyTitle}>No file open</div>
          <div style={styles.emptyText}>Select a file from the explorer to start editing</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Tab bar */}
      <div style={styles.tabs}>
        <div style={styles.tabList}>
          {openFiles.map((file) => {
            const name = file.path.split("/").pop() || file.path;
            const isActive = file.path === activeFile;
            return (
              <div
                key={file.path}
                style={{
                  ...styles.tab,
                  background: isActive ? "var(--bg-primary)" : "transparent",
                  borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  color: isActive ? "var(--text-bright)" : "var(--text-secondary)",
                }}
                onClick={() => onSetActive(file.path)}
                title={file.path}
              >
                <span>{name}</span>
                {file.dirty && <span style={styles.dot}>●</span>}
                <span
                  style={styles.closeTab}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseFile(file.path);
                  }}
                >
                  ×
                </span>
              </div>
            );
          })}
        </div>
        {activeFileObj && onExplain && (
          <button
            style={{
              ...styles.explainBtn,
              ...(aiLoading ? { opacity: 0.6 } : {}),
              ...(!features.ai ? { opacity: 0.5 } : {}),
            }}
            onClick={features.ai ? () => onExplain(activeFileObj.path, activeFileObj.content) : undefined}
            disabled={aiLoading || !features.ai}
            title={features.ai ? "Explain this file with AI" : "Pro feature — upgrade to unlock"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {aiLoading ? "Analyzing..." : "Explain"}
            {!features.ai && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Editor */}
      <div style={styles.editorWrap}>
        {activeFileObj && (
          <MonacoEditor
            theme="vs-dark"
            language={getLanguage(activeFileObj.path)}
            value={activeFileObj.content}
            onChange={handleChange}
            onMount={handleMount}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
              tabSize: 2,
              cursorBlinking: "smooth",
              smoothScrolling: true,
              padding: { top: 8 },
              renderLineHighlight: "gutter",
            }}
          />
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  tabs: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "var(--bg-secondary)",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  tabList: {
    display: "flex",
    overflowX: "auto",
    flex: 1,
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontSize: 12,
    borderRight: "1px solid var(--border)",
    userSelect: "none",
    transition: "background 0.1s ease",
  },
  dot: {
    color: "var(--warning)",
    fontSize: 10,
  },
  closeTab: {
    fontSize: 16,
    lineHeight: 1,
    color: "var(--text-secondary)",
    padding: "0 2px",
    borderRadius: 3,
    opacity: 0.5,
    transition: "opacity 0.15s",
  },
  explainBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 10px",
    marginRight: 8,
    background: "rgba(6, 182, 212, 0.1)",
    color: "var(--accent)",
    border: "1px solid rgba(6, 182, 212, 0.2)",
    borderRadius: 4,
    fontSize: 11,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  editorWrap: {
    flex: 1,
    overflow: "hidden",
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
  },
  emptyTitle: {
    color: "var(--text-secondary)",
    fontSize: 16,
    fontWeight: 500,
    marginBottom: 4,
  },
  emptyText: {
    color: "var(--text-secondary)",
    fontSize: 13,
    opacity: 0.6,
  },
};
