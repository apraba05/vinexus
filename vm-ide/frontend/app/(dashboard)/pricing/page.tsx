"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import NavBar from "@/components/NavBar";
import { useTheme } from "@/lib/ThemeContext";
import { type Plan } from "@/lib/plans";

// ─── Tier definitions ────────────────────────────────────────────────────────

interface Tier {
  key: Plan;
  label: string;
  price: string;
  period: string;
  model: string | null;
  tokens: string | null;
  inheritLabel: string | null;
  features: string[];
  cta: string;
  ctaHref?: string;
  popular?: boolean;
  contact?: boolean;
}

const TIERS: Tier[] = [
  {
    key: "free",
    label: "Free",
    price: "$0",
    period: "forever",
    model: null,
    tokens: null,
    inheritLabel: null,
    features: [
      "1 VM connection",
      "Monaco editor (VS Code engine)",
      "Integrated terminal (PTY over SSH)",
      "File explorer & SFTP",
      "Git source control",
      "Server management (systemctl, logs)",
      "Community support",
    ],
    cta: "Download free",
    ctaHref: "/dashboard",
  },
  {
    key: "premium",
    label: "Premium",
    price: "$19",
    period: "/ month",
    model: "Claude Haiku",
    tokens: "5M tokens / month",
    inheritLabel: "Everything in Free, plus",
    features: [
      "3 VM connections",
      "Deploy automation",
      "AI file validation",
      "Token usage dashboard",
      "Priority support",
    ],
    cta: "Get Premium",
  },
  {
    key: "max",
    label: "Max",
    price: "$49",
    period: "/ month",
    model: "Claude Sonnet",
    tokens: "10M tokens / month",
    inheritLabel: "Everything in Premium, plus",
    features: [
      "Unlimited VM connections",
      "Custom deploy scripts",
      "Docker container management",
      "Deployment pipelines",
      "Secrets & env var management",
    ],
    cta: "Get Max",
    popular: true,
  },
  {
    key: "ai-pro",
    label: "AI Pro",
    price: "$99",
    period: "/ month",
    model: "Claude Sonnet",
    tokens: "30M tokens / month",
    inheritLabel: "Everything in Max, plus",
    features: [
      "Infrastructure monitoring",
      "Team collaboration",
      "Token top-ups available",
      "Advanced AI diagnostics",
    ],
    cta: "Get AI Pro",
  },
  {
    key: "enterprise",
    label: "Enterprise",
    price: "Custom",
    period: "",
    model: "Claude Opus",
    tokens: "Custom token allocation",
    inheritLabel: "Everything in AI Pro, plus",
    features: [
      "Unlimited AI requests",
      "SSO & access controls",
      "On-premise deployment",
      "Custom integrations",
      "Dedicated support engineer",
      "SLA guarantee",
    ],
    cta: "Contact us",
    contact: true,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const { D } = useTheme();
  const { data: session } = useSession();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPlan: Plan = ((session as any)?.plan as Plan) ?? "free";

  const handleCheckout = async (tier: Tier) => {
    if (tier.ctaHref) { router.push(tier.ctaHref); return; }
    if (tier.contact) { window.location.href = "mailto:support@vinexus.space?subject=Enterprise%20inquiry"; return; }
    if (!session) { router.push(`/login?callbackUrl=/pricing`); return; }
    if (tier.key === currentPlan) return;

    setLoadingPlan(tier.key);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: tier.key, billing: "monthly" }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setError(data.error ?? "Could not start checkout. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <NavBar />
      <div style={{ background: D.surface, minHeight: "100vh", padding: "56px 0 80px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>

          {/* ── Header ── */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: D.primary,
              margin: "0 0 12px",
            }}>
              Pricing
            </p>
            <h1 style={{
              fontSize: 32, fontWeight: 800, color: D.inverseSurface,
              letterSpacing: "-0.03em", margin: "0 0 12px", lineHeight: 1.15,
            }}>
              A plan for every team
            </h1>
            <p style={{
              fontSize: 14, color: D.onSurfaceVariant, lineHeight: 1.6,
              margin: "0 auto", maxWidth: 460,
            }}>
              Start free. Upgrade as your AI usage grows. Cancel anytime.
            </p>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div style={{
              margin: "0 auto 24px", maxWidth: 480, padding: "10px 16px",
              background: "rgba(248,81,73,0.07)", border: "1px solid rgba(248,81,73,0.2)",
              borderRadius: 8, fontSize: 13, color: "#f85149", textAlign: "center",
            }}>
              {error}
            </div>
          )}

          {/* ── Cards grid ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 12,
            alignItems: "stretch",
            overflowX: "auto",
            minWidth: 0,
          }}>
            {TIERS.map((tier) => (
              <TierCard
                key={tier.key}
                tier={tier}
                isCurrent={currentPlan === tier.key}
                loading={loadingPlan === tier.key}
                onCta={() => handleCheckout(tier)}
                D={D}
              />
            ))}
          </div>

          {/* ── Footer note ── */}
          <p style={{
            textAlign: "center", fontSize: 12, color: D.onSurfaceVariant,
            marginTop: 32, lineHeight: 1.6,
          }}>
            All plans include a 14-day free trial on first purchase. Prices in USD. Taxes may apply.
            <br />
            Questions?{" "}
            <a href="mailto:support@vinexus.space" style={{ color: D.primary, textDecoration: "none", fontWeight: 600 }}>
              Contact us
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

// ─── TierCard ─────────────────────────────────────────────────────────────────

function TierCard({ tier, isCurrent, loading, onCta, D }: {
  tier: Tier;
  isCurrent: boolean;
  loading: boolean;
  onCta: () => void;
  D: any;
}) {
  const isPopular = !!tier.popular;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      borderRadius: 12,
      border: isPopular
        ? `2px solid ${D.primary}`
        : `1px solid ${D.outlineVariant}`,
      background: isPopular ? D.surfaceContainerHigh : D.surfaceContainerLow,
      padding: "20px 18px",
      position: "relative",
      boxShadow: isPopular ? `0 0 0 4px ${D.primary}10` : "none",
    }}>
      {/* Popular badge */}
      {isPopular && (
        <div style={{
          position: "absolute",
          top: -11,
          left: "50%",
          transform: "translateX(-50%)",
          background: D.primary,
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "3px 10px",
          borderRadius: 9999,
          whiteSpace: "nowrap",
        }}>
          Most Popular
        </div>
      )}

      {/* Tier name */}
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: isPopular ? D.primary : D.onSurfaceVariant,
        marginBottom: 10,
      }}>
        {tier.label}
      </div>

      {/* Price */}
      <div style={{ marginBottom: 4 }}>
        <span style={{
          fontSize: 28, fontWeight: 800, color: D.inverseSurface,
          letterSpacing: "-0.03em", lineHeight: 1,
        }}>
          {tier.price}
        </span>
        {tier.period && (
          <span style={{ fontSize: 12, color: D.onSurfaceVariant, marginLeft: 4 }}>
            {tier.period}
          </span>
        )}
      </div>

      {/* Model + tokens */}
      <div style={{ minHeight: 32, marginBottom: 16 }}>
        {tier.tokens && (
          <div style={{ fontSize: 11, color: D.onSurfaceVariant, lineHeight: 1.5 }}>
            {tier.tokens}
          </div>
        )}
        {tier.model && (
          <div style={{
            fontSize: 11, fontWeight: 600,
            color: isPopular ? D.primary : D.onSurfaceVariant,
            opacity: 0.85,
          }}>
            {tier.model}
          </div>
        )}
        {!tier.model && !tier.tokens && (
          <div style={{ fontSize: 11, color: D.onSurfaceVariant }}>No AI included</div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: D.outlineVariant, opacity: 0.6, marginBottom: 14 }} />

      {/* Inheritance label */}
      {tier.inheritLabel && (
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
          color: D.onSurfaceVariant, textTransform: "uppercase",
          marginBottom: 8,
        }}>
          {tier.inheritLabel}
        </div>
      )}

      {/* Feature list */}
      <ul style={{ listStyle: "none", margin: "0 0 auto", padding: 0, flex: 1 }}>
        {tier.features.map((feat) => (
          <li key={feat} style={{
            display: "flex", alignItems: "flex-start", gap: 7,
            fontSize: 12, color: D.onSurface, lineHeight: 1.55,
            marginBottom: 6,
          }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginTop: 2,
              color: isPopular ? D.primary : D.success ?? "#3fb950",
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            {feat}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div style={{ marginTop: 20 }}>
        {isCurrent ? (
          <div style={{
            width: "100%", padding: "9px 0", borderRadius: 8,
            textAlign: "center", fontSize: 12, fontWeight: 600,
            color: D.onSurfaceVariant,
            border: `1px solid ${D.outlineVariant}`,
            background: "transparent",
          }}>
            Current plan
          </div>
        ) : (
          <button
            onClick={onCta}
            disabled={loading}
            style={{
              width: "100%",
              padding: "9px 0",
              borderRadius: 8,
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              fontFamily: "inherit",
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              ...(isPopular
                ? { background: D.primary, color: "#fff" }
                : tier.contact
                  ? { background: "transparent", color: D.inverseSurface, border: `1.5px solid ${D.outlineVariant}` }
                  : { background: D.surfaceContainerHigh, color: D.inverseSurface, border: `1px solid ${D.outlineVariant}` }),
            }}
          >
            {loading
              ? <Spinner />
              : tier.cta}
          </button>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 12, height: 12,
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "currentColor",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}
