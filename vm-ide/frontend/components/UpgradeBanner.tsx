"use client";
import React from "react";
import { usePlan } from "@/contexts/PlanContext";
import Link from "next/link";

const PRICING_URL = "https://vinexus.space/pricing";

function UpgradeLink({ style, label }: { style: React.CSSProperties; label: string }) {
  const isEl = typeof window !== "undefined" && "electronAPI" in window;
  if (isEl) {
    return (
      <button
        style={{ ...style, background: "linear-gradient(135deg, #06b6d4, #0891b2)", border: "none", cursor: "pointer" }}
        onClick={() => (window as any).electronAPI.app.openExternal(PRICING_URL)}
      >
        {label}
      </button>
    );
  }
  return <Link href="/pricing" style={style}>{label}</Link>;
}

export default function UpgradeBanner() {
  const { plan, isPro, isLoading } = usePlan();

  // Always hide for pro/paid plans
  if (isLoading || isPro) return null;

  // Free plan: show a soft nudge toward upgrading for more AI capacity
  const isFree = !plan || plan === "free";
  if (!isFree) return null;

  return (
    <div style={styles.banner}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span>You&apos;re on the Free plan — upgrade for more AI tokens &amp; VM connections</span>
      <UpgradeLink style={styles.link} label="View plans" />
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
    background: "linear-gradient(90deg, rgba(6,182,212,0.08), rgba(168,85,247,0.08))",
    borderBottom: "1px solid rgba(6, 182, 212, 0.15)",
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
