"use client";
import React from "react";
import { usePlan } from "@/contexts/PlanContext";
import Link from "next/link";

const PRICING_URL = "https://vinexus.space/pricing";

function UpgradeLink({ style }: { style: React.CSSProperties }) {
  const isEl = typeof window !== "undefined" && "electronAPI" in window;
  if (isEl) {
    return (
      <button
        style={{ ...style, background: "linear-gradient(135deg, #06b6d4, #0891b2)", border: "none", cursor: "pointer" }}
        onClick={() => (window as any).electronAPI.app.openExternal(PRICING_URL)}
      >
        Upgrade to Pro
      </button>
    );
  }
  return <Link href="/pricing" style={style}>Upgrade to Pro</Link>;
}

export default function UpgradeBanner() {
  const { isPro, isLoading } = usePlan();

  if (isLoading || isPro) return null;

  return (
    <div style={styles.banner}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span>Unlock Server Commands &amp; AI Insights</span>
      <UpgradeLink style={styles.link} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "6px 16px",
    background: "linear-gradient(90deg, rgba(6,182,212,0.12), rgba(168,85,247,0.12))",
    borderBottom: "1px solid rgba(6, 182, 212, 0.2)",
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 11,
    padding: "3px 10px",
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
    borderRadius: 4,
  },
};
