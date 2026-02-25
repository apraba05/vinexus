"use client";
import React from "react";
import { DeployStatus, DeployState } from "@/lib/api";

interface Props {
  status: DeployStatus | null;
  loading: boolean;
  error: string | null;
  onDeploy: () => void;
  onCancel: () => void;
  onRollback: () => void;
  onReset: () => void;
  hasService: boolean;
}

const STEP_LABELS: Record<string, string> = {
  save_files: "Save Files",
  validate: "Validate",
  backup: "Create Backups",
  deploy_service: "Deploy Service",
  check_status: "Check Status",
  fetch_logs: "Fetch Logs",
  rollback: "Rollback",
  deploy_complete: "Complete",
  pipeline_error: "Pipeline Error",
  cancelled: "Cancelled",
  rollback_complete: "Rollback Complete",
  rollback_failed: "Rollback Failed",
};

const STATE_COLORS: Record<string, string> = {
  idle: "var(--text-secondary)",
  saving: "var(--accent)",
  validating: "var(--accent)",
  backing_up: "var(--accent)",
  deploying: "#f0c040",
  checking_status: "var(--accent)",
  fetching_logs: "var(--accent)",
  completed: "var(--success)",
  failed: "var(--danger)",
  rolling_back: "#f0c040",
};

export default function DeployPanel({
  status,
  loading,
  error,
  onDeploy,
  onCancel,
  onRollback,
  onReset,
  hasService,
}: Props) {
  if (!status && !error) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyContent}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2, marginBottom: 8 }}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            {hasService
              ? "Ready to deploy. Click the Deploy button to start."
              : "No .vmide.json found. Create one on your VM to enable deployments."}
          </div>
          {hasService && (
            <button style={styles.deployBtn} onClick={onDeploy} disabled={loading}>
              Deploy Now
            </button>
          )}
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBanner}>
          <span>{error}</span>
          <button style={styles.resetBtn} onClick={onReset}>Dismiss</button>
        </div>
      </div>
    );
  }

  if (!status) return null;

  const elapsed = status.completedAt
    ? status.completedAt - status.startedAt
    : Date.now() - status.startedAt;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span
            style={{
              ...styles.stateBadge,
              background: `${STATE_COLORS[status.state] || "var(--text-secondary)"}22`,
              color: STATE_COLORS[status.state] || "var(--text-secondary)",
            }}
          >
            {status.state === "completed" ? "SUCCESS" : status.state.toUpperCase().replace(/_/g, " ")}
          </span>
          <span style={styles.deployId}>
            {status.deployId.slice(0, 8)}
          </span>
          <span style={styles.elapsed}>{formatDuration(elapsed)}</span>
        </div>
        <div style={styles.headerRight}>
          {status.state === "failed" && (
            <>
              <button style={styles.actionBtn} onClick={onRollback} disabled={loading}>
                Rollback
              </button>
            </>
          )}
          {!["completed", "failed"].includes(status.state) && (
            <button style={styles.cancelBtn} onClick={onCancel} disabled={loading}>
              Cancel
            </button>
          )}
          {["completed", "failed"].includes(status.state) && (
            <button style={styles.resetBtn} onClick={onReset}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Pipeline steps */}
      <div style={styles.steps}>
        {status.steps.map((step, i) => (
          <div key={i} style={styles.step}>
            <div style={styles.stepIcon}>
              {step.success ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>
            <div style={styles.stepContent}>
              <div style={styles.stepName}>
                {STEP_LABELS[step.step] || step.step}
                <span style={styles.stepDuration}>{step.durationMs}ms</span>
              </div>
              {step.output && (
                <div style={styles.stepOutput}>{step.output}</div>
              )}
              {step.error && (
                <pre style={styles.stepError}>{step.error}</pre>
              )}
            </div>
          </div>
        ))}

        {/* Active step indicator */}
        {!["completed", "failed"].includes(status.state) && (
          <div style={styles.step}>
            <div style={styles.stepIcon}>
              <span style={styles.spinner} />
            </div>
            <div style={styles.stepContent}>
              <div style={styles.stepName}>
                {STEP_LABELS[status.currentStep] || status.currentStep || "Starting..."}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "auto",
    background: "var(--bg-primary)",
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
    textAlign: "center",
    maxWidth: 300,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
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
    gap: 6,
  },
  stateBadge: {
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "monospace",
    letterSpacing: "0.5px",
  },
  deployId: {
    fontSize: 10,
    color: "var(--text-secondary)",
    fontFamily: "monospace",
    opacity: 0.6,
  },
  elapsed: {
    fontSize: 10,
    color: "var(--text-secondary)",
    opacity: 0.5,
  },
  deployBtn: {
    padding: "8px 20px",
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  actionBtn: {
    padding: "4px 10px",
    background: "rgba(6, 182, 212, 0.1)",
    color: "var(--accent)",
    border: "1px solid rgba(6, 182, 212, 0.2)",
    borderRadius: 4,
    fontSize: 11,
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "4px 10px",
    background: "rgba(255, 107, 107, 0.1)",
    color: "var(--danger)",
    border: "1px solid rgba(255, 107, 107, 0.2)",
    borderRadius: 4,
    fontSize: 11,
    cursor: "pointer",
  },
  resetBtn: {
    padding: "4px 10px",
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    fontSize: 11,
    cursor: "pointer",
  },
  errorBanner: {
    padding: "10px 14px",
    background: "rgba(255, 107, 107, 0.1)",
    color: "var(--danger)",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  steps: {
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  step: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
  },
  stepIcon: {
    width: 20,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepContent: {
    flex: 1,
    minWidth: 0,
  },
  stepName: {
    fontSize: 12,
    color: "var(--text-primary)",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  stepDuration: {
    fontSize: 10,
    color: "var(--text-secondary)",
    opacity: 0.5,
    fontFamily: "monospace",
  },
  stepOutput: {
    fontSize: 11,
    color: "var(--text-secondary)",
    marginTop: 2,
  },
  stepError: {
    fontSize: 11,
    color: "var(--danger)",
    marginTop: 4,
    padding: "6px 8px",
    background: "rgba(255, 107, 107, 0.08)",
    borderRadius: 4,
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    fontFamily: "monospace",
    lineHeight: 1.4,
    margin: "4px 0 0 0",
    maxHeight: 150,
    overflow: "auto",
  },
  spinner: {
    display: "inline-block",
    width: 12,
    height: 12,
    border: "2px solid var(--accent)",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },
};
