"use client";
import React from "react";
import { usePlan, PlanFeatures } from "@/contexts/PlanContext";
import Link from "next/link";

interface Props {
  feature: keyof PlanFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProFeature({ feature, children, fallback }: Props) {
  const { features, isLoading } = usePlan();

  if (isLoading) return null;

  if (features[feature]) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <div style={styles.locked}>
      <div style={styles.lockIcon}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <span style={styles.lockText}>Pro Feature</span>
      <Link href="/pricing" style={styles.upgradeLink}>
        Upgrade
      </Link>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  locked: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "12px 16px",
    background: "rgba(6, 182, 212, 0.05)",
    border: "1px solid rgba(6, 182, 212, 0.15)",
    borderRadius: 8,
  },
  lockIcon: {
    color: "var(--accent)",
    display: "flex",
    alignItems: "center",
  },
  lockText: {
    fontSize: 13,
    color: "var(--text-secondary)",
    fontWeight: 500,
  },
  upgradeLink: {
    fontSize: 12,
    color: "var(--accent)",
    textDecoration: "none",
    fontWeight: 600,
    padding: "4px 10px",
    background: "rgba(6, 182, 212, 0.1)",
    borderRadius: 4,
  },
};
