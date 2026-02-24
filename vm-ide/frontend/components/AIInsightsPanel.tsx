"use client";
import React from "react";
import { AIExplanation, AIAnalysis } from "@/lib/api";

interface Props {
  visible: boolean;
  loading: boolean;
  explanation: AIExplanation | null;
  diagnosis: AIAnalysis | null;
  filePath: string | null;
  onClose: () => void;
  usageCount?: number;
  usageLimit?: number;
}

export default function AIInsightsPanel({
  visible,
  loading,
  explanation,
  diagnosis,
  filePath,
  onClose,
  usageCount = 0,
  usageLimit = 15,
}: Props) {
  if (!visible) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span style={styles.headerTitle}>AI Insights</span>
            {filePath && (
              <span style={styles.fileBadge}>
                {filePath.split("/").pop()}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UsageBadge count={usageCount} limit={usageLimit} />
            <button style={styles.closeBtn} onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {loading && (
            <div style={styles.loadingState}>
              <span style={styles.spinner} />
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Analyzing with Claude...
              </span>
            </div>
          )}

          {!loading && explanation && (
            <div style={styles.sections}>
              {/* Summary */}
              <div style={styles.section}>
                <div style={styles.summary}>{explanation.summary}</div>
              </div>

              {/* Risks */}
              {explanation.risks.length > 0 && (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>
                    <SectionIcon color="var(--danger)" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    Risks
                  </div>
                  {explanation.risks.map((r, i) => (
                    <div key={i} style={{ ...styles.item, borderLeftColor: "var(--danger)" }}>
                      {r}
                    </div>
                  ))}
                </div>
              )}

              {/* Misconfigurations */}
              {explanation.misconfigurations.length > 0 && (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>
                    <SectionIcon color="#f0c040" d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    Misconfigurations
                  </div>
                  {explanation.misconfigurations.map((m, i) => (
                    <div key={i} style={{ ...styles.item, borderLeftColor: "#f0c040" }}>
                      {m}
                    </div>
                  ))}
                </div>
              )}

              {/* Optimizations */}
              {explanation.optimizations.length > 0 && (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>
                    <SectionIcon color="var(--success)" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    Optimizations
                  </div>
                  {explanation.optimizations.map((o, i) => (
                    <div key={i} style={{ ...styles.item, borderLeftColor: "var(--success)" }}>
                      {o}
                    </div>
                  ))}
                </div>
              )}

              {/* Line Notes */}
              {explanation.lineNotes.length > 0 && (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>
                    <SectionIcon color="var(--accent)" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    Line Notes
                  </div>
                  {explanation.lineNotes.map((ln, i) => (
                    <div key={i} style={styles.lineNote}>
                      <span style={styles.lineNum}>L{ln.line}</span>
                      <span>{ln.note}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* All clear */}
              {explanation.risks.length === 0 &&
                explanation.misconfigurations.length === 0 &&
                explanation.optimizations.length === 0 && (
                  <div style={styles.allClear}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    No issues found. Configuration looks good.
                  </div>
                )}
            </div>
          )}

          {!loading && diagnosis && (
            <div style={styles.sections}>
              {/* Severity */}
              <div style={styles.section}>
                <span style={{
                  ...styles.severityBadge,
                  background: SEVERITY_COLORS[diagnosis.severity] + "22",
                  color: SEVERITY_COLORS[diagnosis.severity],
                }}>
                  {diagnosis.severity.toUpperCase()}
                </span>
              </div>

              {/* Root Cause */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <SectionIcon color="var(--danger)" d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  Root Cause
                </div>
                <div style={styles.summary}>{diagnosis.rootCause}</div>
              </div>

              {/* Explanation */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <SectionIcon color="var(--accent)" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  Explanation
                </div>
                <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.6 }}>
                  {diagnosis.explanation}
                </div>
              </div>

              {/* Suggested Fixes */}
              {diagnosis.suggestedFixes.length > 0 && (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>
                    <SectionIcon color="var(--success)" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    Suggested Fixes
                  </div>
                  {diagnosis.suggestedFixes.map((f, i) => (
                    <div key={i} style={styles.fixItem}>
                      <span style={styles.fixNum}>{i + 1}</span>
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && !explanation && !diagnosis && (
            <div style={styles.emptyState}>
              No analysis available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsageBadge({ count, limit }: { count: number; limit: number }) {
  const atLimit = count >= limit;
  return (
    <span style={{
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 600,
      fontFamily: "monospace",
      background: atLimit ? "rgba(239, 68, 68, 0.1)" : "rgba(6, 182, 212, 0.1)",
      color: atLimit ? "#ef4444" : "#06b6d4",
      border: atLimit ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(6, 182, 212, 0.2)",
    }}>
      {count}/{limit} today
    </span>
  );
}

function SectionIcon({ color, d }: { color: string; d: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "var(--text-secondary)",
  medium: "#f0c040",
  high: "#ff6b6b",
  critical: "#ff4444",
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "flex-end",
  },
  panel: {
    width: 420,
    maxWidth: "90vw",
    height: "100%",
    background: "var(--bg-primary)",
    borderLeft: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.3)",
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
  headerTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  fileBadge: {
    padding: "2px 8px",
    background: "var(--bg-tertiary)",
    borderRadius: 4,
    fontSize: 10,
    fontFamily: "monospace",
    color: "var(--text-secondary)",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: 4,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
  },
  content: {
    flex: 1,
    overflow: "auto",
    padding: 16,
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 60,
  },
  spinner: {
    display: "inline-block",
    width: 24,
    height: 24,
    border: "3px solid var(--border)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  sections: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "var(--text-secondary)",
  },
  summary: {
    fontSize: 13,
    color: "var(--text-primary)",
    lineHeight: 1.5,
    padding: "8px 12px",
    background: "var(--bg-secondary)",
    borderRadius: 6,
  },
  item: {
    fontSize: 12,
    color: "var(--text-primary)",
    lineHeight: 1.5,
    padding: "6px 10px",
    borderLeft: "3px solid",
    background: "var(--bg-secondary)",
    borderRadius: "0 4px 4px 0",
  },
  lineNote: {
    display: "flex",
    gap: 8,
    fontSize: 12,
    color: "var(--text-primary)",
    lineHeight: 1.5,
    padding: "4px 8px",
    background: "var(--bg-secondary)",
    borderRadius: 4,
  },
  lineNum: {
    fontFamily: "monospace",
    fontSize: 10,
    fontWeight: 700,
    color: "var(--accent)",
    flexShrink: 0,
    minWidth: 30,
  },
  allClear: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "var(--success)",
    padding: "12px 16px",
    background: "rgba(81, 207, 102, 0.08)",
    borderRadius: 6,
  },
  severityBadge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "monospace",
    letterSpacing: "0.5px",
  },
  fixItem: {
    display: "flex",
    gap: 8,
    fontSize: 12,
    color: "var(--text-primary)",
    lineHeight: 1.5,
    padding: "6px 10px",
    background: "var(--bg-secondary)",
    borderRadius: 4,
  },
  fixNum: {
    width: 18,
    height: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "rgba(6, 182, 212, 0.15)",
    color: "var(--accent)",
    fontSize: 10,
    fontWeight: 700,
    flexShrink: 0,
  },
  emptyState: {
    color: "var(--text-secondary)",
    fontSize: 13,
    textAlign: "center",
    paddingTop: 40,
  },
};
