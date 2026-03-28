"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { type Plan, PLAN_PRICES, PLAN_LABELS } from "@/lib/plans";

interface UpgradeTier {
  plan: Plan;
  label: string;
  price: string;
  tokens: string;
}

const UPGRADE_PATH: Record<Plan, UpgradeTier | null> = {
  free: { plan: "premium", label: "Premium", price: "$19/mo", tokens: "3M tokens/month" },
  premium: { plan: "max", label: "Max", price: "$49/mo", tokens: "8M tokens/month" },
  max: { plan: "ai-pro", label: "AI Pro", price: "$99/mo", tokens: "20M tokens/month" },
  "ai-pro": { plan: "enterprise", label: "Enterprise", price: "Custom", tokens: "Unlimited tokens" },
  enterprise: null,
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentPlan: Plan;
  tokensUsed?: number;
  tokenLimit?: number;
  resetAt?: string;
  isDailyLimit?: boolean;
}

export default function TokenLimitModal({
  open,
  onClose,
  currentPlan,
  tokensUsed = 0,
  tokenLimit = 0,
  resetAt,
  isDailyLimit = false,
}: Props) {
  const router = useRouter();
  if (!open) return null;

  const nextTier = UPGRADE_PATH[currentPlan];
  const pct = tokenLimit > 0 ? Math.min(Math.round((tokensUsed / tokenLimit) * 100), 100) : 100;
  const barColor = pct >= 85 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#3fb950";

  const formatResetDate = (dateStr?: string) => {
    if (!dateStr) return "next month";
    const d = new Date(dateStr + "T00:00:00Z");
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface-container, #161b22)",
          border: "1px solid var(--outline-variant, #30363d)",
          borderRadius: 12,
          padding: "28px 28px 24px",
          maxWidth: 380,
          width: "90%",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(239,68,68,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--on-surface, #e6edf3)", lineHeight: 1.2 }}>
              {isDailyLimit ? "Daily request limit reached" : "Monthly token limit reached"}
            </div>
            <div style={{ fontSize: 11, color: "var(--on-surface-variant, #8b949e)", marginTop: 2 }}>
              {PLAN_LABELS[currentPlan]} plan
            </div>
          </div>
        </div>

        {/* Usage bar */}
        {!isDailyLimit && tokenLimit > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: 11, color: "var(--on-surface-variant, #8b949e)", marginBottom: 5,
            }}>
              <span>Usage</span>
              <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--on-surface, #e6edf3)" }}>
                {formatTokens(tokensUsed)} / {formatTokens(tokenLimit)} tokens
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3 }} />
            </div>
          </div>
        )}

        {/* Reset note */}
        <div style={{
          fontSize: 11, color: "var(--on-surface-variant, #8b949e)",
          marginBottom: 20, lineHeight: 1.5,
        }}>
          {isDailyLimit
            ? "Your daily request limit resets at midnight UTC."
            : `Your token balance resets on ${formatResetDate(resetAt)}.`}
        </div>

        {/* Upgrade CTA */}
        {nextTier && (
          <div style={{
            padding: "14px 16px",
            background: "rgba(88,166,255,0.06)",
            border: "1px solid rgba(88,166,255,0.15)",
            borderRadius: 8,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, color: "#58a6ff", fontWeight: 700, marginBottom: 6 }}>
              Upgrade to {nextTier.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--on-surface, #e6edf3)", marginBottom: 10, lineHeight: 1.5 }}>
              Get {nextTier.tokens} for {nextTier.price}
            </div>
            <button
              onClick={() => { onClose(); router.push("/pricing"); }}
              style={{
                width: "100%", padding: "8px 0", borderRadius: 6,
                border: "none", background: "#58a6ff", color: "#0d1117",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              View upgrade options
            </button>
          </div>
        )}

        {/* Dismiss */}
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "7px 0", borderRadius: 6,
            border: "1px solid var(--outline-variant, #30363d)",
            background: "transparent",
            color: "var(--on-surface-variant, #8b949e)",
            fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
