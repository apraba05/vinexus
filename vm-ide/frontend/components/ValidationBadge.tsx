"use client";
import React from "react";
import { ValidationReport } from "@/lib/api";

interface Props {
  report: ValidationReport | null;
  loading: boolean;
  onValidate: () => void;
  disabled: boolean;
}

export default function ValidationBadge({
  report,
  loading,
  onValidate,
  disabled,
}: Props) {
  const valid = report?.overallValid ?? null;

  return (
    <button
      style={{
        ...styles.badge,
        ...(loading ? styles.badgeLoading : {}),
        ...(valid === true ? styles.badgeValid : {}),
        ...(valid === false ? styles.badgeInvalid : {}),
      }}
      onClick={onValidate}
      disabled={disabled || loading}
      title={
        loading
          ? "Validating..."
          : valid === true
          ? "Validation passed"
          : valid === false
          ? `Validation failed: ${report?.results.filter((r) => !r.result.valid).length} error(s)`
          : "Click to validate file"
      }
    >
      {loading ? (
        <span style={styles.spinner} />
      ) : valid === true ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : valid === false ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      )}
      <span style={{ fontSize: 11 }}>
        {loading ? "Validating" : valid === true ? "Valid" : valid === false ? "Invalid" : "Validate"}
      </span>
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  badge: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 8px",
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 11,
    transition: "all 0.15s ease",
  },
  badgeLoading: {
    color: "var(--accent)",
    borderColor: "rgba(6, 182, 212, 0.3)",
  },
  badgeValid: {
    color: "var(--success)",
    borderColor: "rgba(81, 207, 102, 0.3)",
    background: "rgba(81, 207, 102, 0.06)",
  },
  badgeInvalid: {
    color: "var(--danger)",
    borderColor: "rgba(255, 107, 107, 0.3)",
    background: "rgba(255, 107, 107, 0.06)",
  },
  spinner: {
    display: "inline-block",
    width: 10,
    height: 10,
    border: "2px solid var(--accent)",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },
};
