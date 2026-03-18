"use client";
import React, { useState, useRef, useEffect } from "react";
import { usePlan } from "@/contexts/PlanContext";

interface Props {
  sessionId: string | null;
  activeFile: string | null;
  hasDirtyFiles: boolean;
  onSave: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onDeploy?: () => void;
  hasService?: boolean;
  isDeploying?: boolean;
  showCommands?: boolean;
  onToggleCommands?: () => void;
  children?: React.ReactNode;
}

function Icon({ d, size = 13 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function Toolbar({
  sessionId,
  activeFile,
  hasDirtyFiles,
  onSave,
  onNewFile,
  onNewFolder,
  onDeploy,
  hasService = false,
  isDeploying = false,
  showCommands = false,
  onToggleCommands,
  children,
}: Props) {
  const disabled = !sessionId;
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);
  const { features } = usePlan();

  useEffect(() => {
    if (!newMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setNewMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [newMenuOpen]);

  return (
    <div style={styles.bar}>
      <div style={styles.group}>
        {/* Save */}
        <button
          style={{
            ...styles.btn,
            ...(hasDirtyFiles && activeFile ? styles.btnSaveDirty : {}),
          }}
          disabled={disabled || !activeFile || !hasDirtyFiles}
          onClick={onSave}
          title="Save (Ctrl+S)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          <span>Save</span>
          {hasDirtyFiles && activeFile && <span style={styles.dirtyDot} />}
        </button>

        <div style={styles.sep} />

        {/* New + dropdown */}
        <div ref={newMenuRef} style={{ position: "relative" }}>
          <button
            style={{
              ...styles.btn,
              opacity: disabled ? 0.45 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
            disabled={disabled}
            onClick={() => setNewMenuOpen(!newMenuOpen)}
            title="Create new file or folder"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New</span>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.4 }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {newMenuOpen && (
            <div style={styles.dropdown}>
              <button
                style={styles.dropItem}
                onClick={() => { onNewFile(); setNewMenuOpen(false); }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                New File
              </button>
              <button
                style={styles.dropItem}
                onClick={() => { onNewFolder(); setNewMenuOpen(false); }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                New Folder
              </button>
            </div>
          )}
        </div>

        {/* Server Commands toggle */}
        {sessionId && onToggleCommands && (
          <>
            <div style={styles.sep} />
            <button
              style={{
                ...styles.btn,
                ...(showCommands ? styles.btnActive : {}),
                ...(!features.commands ? { opacity: 0.45, cursor: "not-allowed" } : {}),
              }}
              onClick={features.commands ? onToggleCommands : undefined}
              title={features.commands ? "Toggle server commands" : "Pro — upgrade to unlock"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
              <span>Server</span>
              {!features.commands && (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
            </button>
          </>
        )}

        {/* Deploy */}
        {hasService && onDeploy && (
          <>
            <div style={styles.sep} />
            <button
              style={{
                ...styles.btn,
                ...styles.deployBtn,
                opacity: (disabled || isDeploying) ? 0.6 : 1,
                cursor: (disabled || isDeploying) ? "not-allowed" : "pointer",
              }}
              disabled={disabled || isDeploying}
              onClick={onDeploy}
              title="Deploy (Ctrl+Shift+D)"
            >
              {isDeploying ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              )}
              <span>{isDeploying ? "Deploying…" : "Deploy"}</span>
            </button>
          </>
        )}
      </div>

      <div style={styles.rightGroup}>
        {children}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 10px",
    height: 36,
    background: "var(--bg-elevated)",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
    gap: 4,
  },
  group: {
    display: "flex",
    alignItems: "center",
    gap: 1,
  },
  btn: {
    padding: "4px 10px",
    height: 26,
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid transparent",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 5,
    cursor: "pointer",
    transition: "all 0.15s ease",
    position: "relative" as const,
  },
  btnSaveDirty: {
    color: "var(--accent)",
    background: "rgba(63, 255, 162, 0.08)",
    border: "1px solid rgba(63, 255, 162, 0.18)",
  },
  btnActive: {
    color: "var(--accent-blue)",
    background: "rgba(79, 142, 247, 0.1)",
    border: "1px solid rgba(79, 142, 247, 0.2)",
  },
  deployBtn: {
    color: "#0b1120",
    background: "var(--gradient-brand)",
    border: "none",
    fontWeight: 700,
    boxShadow: "0 2px 12px rgba(63, 255, 162, 0.2)",
  },
  dirtyDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "var(--accent)",
    position: "absolute" as const,
    top: 4,
    right: 4,
  },
  sep: {
    width: 1,
    height: 14,
    background: "var(--border)",
    margin: "0 4px",
    flexShrink: 0,
  },
  rightGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  dropdown: {
    position: "absolute" as const,
    top: "calc(100% + 4px)",
    left: 0,
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    padding: "4px 0",
    minWidth: 148,
    zIndex: 200,
  },
  dropItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "7px 12px",
    background: "transparent",
    border: "none",
    color: "var(--text-primary)",
    fontSize: 12,
    cursor: "pointer",
    textAlign: "left" as const,
    transition: "background 0.1s",
  },
};
