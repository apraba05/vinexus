"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
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

function ToolbarIcon({ d, size = 14 }: { d: string; size?: number }) {
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

  // Close dropdown on outside click
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
        {/* Dashboard */}
        <Link
          href="/dashboard"
          style={{
            ...styles.btn,
            textDecoration: "none",
            color: "var(--text-secondary)",
          }}
          title="Back to Dashboard"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Dashboard</span>
        </Link>

        <div style={styles.sep} />

        <button
          style={{
            ...styles.btn,
            ...(hasDirtyFiles && activeFile ? styles.btnAccent : {}),
            opacity: (disabled || !activeFile || !hasDirtyFiles) ? 0.7 : 1,
            cursor: (disabled || !activeFile || !hasDirtyFiles) ? "not-allowed" : "pointer",
          }}
          disabled={disabled || !activeFile || !hasDirtyFiles}
          onClick={onSave}
          title="Save (Ctrl+S)"
        >
          <ToolbarIcon d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <span>Save</span>
        </button>

        <div style={styles.sep} />

        {/* New + dropdown */}
        <div ref={newMenuRef} style={{ position: "relative" }}>
          <button
            style={{
              ...styles.btn,
              opacity: disabled ? 0.7 : 1,
              cursor: disabled ? "not-allowed" : "pointer"
            }}
            disabled={disabled}
            onClick={() => setNewMenuOpen(!newMenuOpen)}
            title="Create new file or folder"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New</span>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.5 }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {newMenuOpen && (
            <div style={styles.dropdown}>
              <button
                style={styles.dropdownItem}
                onClick={() => { onNewFile(); setNewMenuOpen(false); }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-active)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <ToolbarIcon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                New File
              </button>
              <button
                style={styles.dropdownItem}
                onClick={() => { onNewFolder(); setNewMenuOpen(false); }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-active)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <ToolbarIcon d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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
                ...(showCommands ? { color: "var(--accent)", background: "rgba(6, 182, 212, 0.08)" } : {}),
                ...(!features.commands ? { opacity: 0.7, cursor: "not-allowed" } : {}),
              }}
              onClick={features.commands ? onToggleCommands : undefined}
              title={features.commands ? "Toggle server commands" : "Pro feature — upgrade to unlock"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
              <span>Server</span>
              {!features.commands && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
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
                opacity: (disabled || isDeploying) ? 0.7 : 1,
                cursor: (disabled || isDeploying) ? "not-allowed" : "pointer",
              }}
              disabled={disabled || isDeploying}
              onClick={onDeploy}
              title="Deploy to VM (Ctrl+Shift+D)"
            >
              <ToolbarIcon d="M22 12h-4l-3 9L9 3l-3 9H2" />
              <span>{isDeploying ? "Deploying..." : "Deploy"}</span>
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
    padding: "4px 12px",
    background: "var(--bg-secondary)",
    borderBottom: "1px solid var(--border)",
    gap: 8,
  },
  group: {
    display: "flex",
    alignItems: "center",
    gap: 2,
  },
  btn: {
    padding: "5px 10px",
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid transparent",
    borderRadius: 5,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    gap: 5,
    cursor: "pointer",
  },
  btnAccent: {
    color: "var(--accent-hover)",
    background: "rgba(6, 182, 212, 0.1)",
    border: "1px solid rgba(6, 182, 212, 0.2)",
  },
  deployBtn: {
    color: "#fff",
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
    border: "1px solid rgba(6, 182, 212, 0.4)",
    fontWeight: 600,
  },
  sep: {
    width: 1,
    height: 16,
    background: "var(--border)",
    margin: "0 4px",
  },
  rightGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  dropdown: {
    position: "absolute" as const,
    top: "100%",
    left: 0,
    marginTop: 4,
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    padding: "4px 0",
    minWidth: 140,
    zIndex: 100,
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "6px 12px",
    background: "transparent",
    border: "none",
    color: "var(--text-primary)",
    fontSize: 12,
    cursor: "pointer",
    textAlign: "left" as const,
  },
};
