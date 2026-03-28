"use client";
import React, { useEffect, useState } from "react";
import { getAIUsage, type AIUsageStats } from "@/lib/api";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function formatResetDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function UsageBar({ pct }: { pct: number }) {
  const color = pct >= 85 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#3fb950";
  return (
    <div style={{
      height: 4, borderRadius: 2,
      background: "rgba(255,255,255,0.08)",
      overflow: "hidden",
    }}>
      <div style={{
        height: "100%",
        width: `${Math.min(pct, 100)}%`,
        background: color,
        borderRadius: 2,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

export default function TokenUsageMeter() {
  const [usage, setUsage] = useState<AIUsageStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAIUsage()
      .then((data) => { if (!cancelled) setUsage(data); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  if (error || !usage) return null;

  const isUnlimitedTokens = usage.tokenLimit === -1;
  const isUnlimitedDaily = usage.dailyLimit === -1;

  const tokenPct = isUnlimitedTokens ? 0 : Math.round((usage.tokensUsed / usage.tokenLimit) * 100);
  const dailyPct = isUnlimitedDaily ? 0 : Math.round((usage.dailyRequests / usage.dailyLimit) * 100);

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: "var(--on-surface-variant, #8b949e)",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 3,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    fontFamily: "monospace",
    color: "var(--on-surface, #e6edf3)",
  };

  return (
    <div style={{
      padding: "8px 10px",
      borderRadius: 6,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      marginBottom: 8,
    }}>
      {/* Monthly tokens */}
      <div style={labelStyle}>
        <span>Tokens this month</span>
        {isUnlimitedTokens ? (
          <span style={{ ...valueStyle, color: "#3fb950" }}>Unlimited</span>
        ) : (
          <span style={valueStyle}>
            {formatTokens(usage.tokensUsed)} / {formatTokens(usage.tokenLimit)}
          </span>
        )}
      </div>
      {!isUnlimitedTokens && <UsageBar pct={tokenPct} />}

      {/* Daily requests — only show if there's a limit */}
      {!isUnlimitedDaily && (
        <div style={{ marginTop: 6 }}>
          <div style={labelStyle}>
            <span>Requests today</span>
            <span style={valueStyle}>
              {usage.dailyRequests} / {usage.dailyLimit}
            </span>
          </div>
          <UsageBar pct={dailyPct} />
        </div>
      )}

      {/* Reset date */}
      {!isUnlimitedTokens && (
        <div style={{
          marginTop: 5,
          fontSize: 9,
          color: "var(--on-surface-variant, #8b949e)",
          textAlign: "right",
        }}>
          resets {formatResetDate(usage.resetAt)}
        </div>
      )}
    </div>
  );
}
