"use client";
import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePlan } from "@/contexts/PlanContext";

const FREE_FEATURES = [
  "Monaco Code Editor",
  "Integrated Terminal (SSH)",
  "File Management",
  "Multi-tab editing",
  "File tree explorer",
];

const FREE_LOCKED = [
  "One-Click Deploy",
  "Server Commands",
  "AI Insights & Diagnostics",
];

const PRO_FEATURES = [
  "Everything in Free",
  "One-Click Deploy",
  "Server Commands",
  "AI File Analysis (15/day)",
  "AI Log Diagnosis (15/day)",
  "AI Config Validation (15/day)",
  "Priority Support",
];

const FAQS = [
  {
    q: "Can I upgrade or downgrade at any time?",
    a: "Yes. Upgrade instantly and get Pro features right away. Downgrade anytime — you keep Pro access until the end of your billing period.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We use Stripe for billing. You can pay with any major credit or debit card.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "The Free plan has no time limit. Start there and upgrade to Pro whenever you're ready.",
  },
];

const Check = ({ color = "#3fffa2" }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6.5" stroke={color} strokeOpacity="0.25" />
    <polyline points="4 7 6 9 10 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Lock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function PricingPage() {
  const { data: session } = useSession();
  const { isPro } = usePlan();

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  return (
    <div style={s.page}>
      {/* Particles */}
      <div style={s.particles} aria-hidden>
        {DOTS.map((d, i) => (
          <span key={i} style={{ position: "absolute", left: d.left, top: d.top, width: d.size, height: d.size, borderRadius: "50%", background: d.color, opacity: d.opacity }} />
        ))}
      </div>
      {/* Wave glow */}
      <div style={s.wave} aria-hidden />

      <div style={s.inner}>

        {/* ── Header ── */}
        <div style={s.header}>
          <div style={s.eyebrow}>Pricing</div>
          <h1 style={s.title}>Choose the perfect plan<br />for your journey</h1>
          <p style={s.subtitle}>Start free. Upgrade when you need the full toolkit.</p>
        </div>

        {/* ── Plan cards ── */}
        <div style={s.cardsRow}>

          {/* FREE */}
          <div style={s.card}>
            <div style={s.planBadge}>Generally Available</div>
            <div style={s.planName}>Free</div>
            <div style={s.planTagline}>CA$0 / month</div>
            <p style={s.planDesc}>For anyone who wants to connect and explore their VMs from the browser.</p>

            <div style={s.divider} />

            <div style={s.featureList}>
              {FREE_FEATURES.map((f) => (
                <div key={f} style={s.featureRow}>
                  <Check color="#3fffa2" />
                  <span style={s.featureText}>{f}</span>
                </div>
              ))}
              {FREE_LOCKED.map((f) => (
                <div key={f} style={{ ...s.featureRow, opacity: 0.3 }}>
                  <Lock />
                  <span style={s.featureText}>{f}</span>
                </div>
              ))}
            </div>

            <div style={s.ctaWrap}>
              {!session ? (
                <Link href="/signup" style={s.ghostBtn}>Get Started Free</Link>
              ) : !isPro ? (
                <div style={s.currentBadge}>Current Plan</div>
              ) : (
                <div style={{ ...s.currentBadge, opacity: 0.4 }}>Free Tier</div>
              )}
            </div>
          </div>

          {/* PRO */}
          <div style={s.cardPro}>
            {/* Teal glow behind Pro card */}
            <div style={s.proGlow} aria-hidden />

            <div style={s.proBadge}>Recommended</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
              <div style={s.proPlanName}>Pro</div>
            </div>
            <div style={s.proPrice}>
              <span style={s.priceDollar}>CA$</span>
              <span style={s.priceNum}>10</span>
              <span style={s.priceInterval}>/month</span>
            </div>
            <p style={{ ...s.planDesc, color: "rgba(255,255,255,0.55)" }}>Unlock the full toolkit — deploy, server commands, and AI-powered insights.</p>

            <div style={{ ...s.divider, borderColor: "rgba(63,255,162,0.1)" }} />

            <div style={s.featureList}>
              {PRO_FEATURES.map((f) => (
                <div key={f} style={s.featureRow}>
                  <Check color="#3fffa2" />
                  <span style={{ ...s.featureText, color: "rgba(255,255,255,0.8)" }}>{f}</span>
                </div>
              ))}
            </div>

            <div style={s.ctaWrap}>
              {!session ? (
                <Link href="/signup" style={s.tealBtn}>Get Started <Arrow /></Link>
              ) : isPro ? (
                <div style={s.currentBadgePro}>Current Plan</div>
              ) : (
                <button style={s.tealBtn} onClick={handleUpgrade}>
                  Upgrade to Pro <Arrow />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* ── Comparison strip ── */}
        <div style={s.compareStrip}>
          {[
            { label: "Monaco Editor", free: true, pro: true },
            { label: "SSH Terminal", free: true, pro: true },
            { label: "File Management", free: true, pro: true },
            { label: "One-Click Deploy", free: false, pro: true },
            { label: "Server Commands", free: false, pro: true },
            { label: "AI Insights", free: false, pro: true },
          ].map((row, i) => (
            <div key={i} style={{ ...s.compareRow, ...(i % 2 === 0 ? s.compareRowAlt : {}) }}>
              <span style={s.compareLabel}>{row.label}</span>
              <div style={s.compareCols}>
                <div style={s.compareCell}>
                  {row.free
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3fffa2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  }
                </div>
                <div style={s.compareCell}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3fffa2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              </div>
            </div>
          ))}
          <div style={s.compareHeader}>
            <span style={s.compareLabel} />
            <div style={s.compareCols}>
              <div style={{ ...s.compareCell, color: "#8fa3c8", fontSize: 12, fontWeight: 600 }}>Free</div>
              <div style={{ ...s.compareCell, color: "#3fffa2", fontSize: 12, fontWeight: 600 }}>Pro</div>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div style={s.faq}>
          <h2 style={s.faqTitle}>Frequently asked questions</h2>
          <div style={s.faqList}>
            {FAQS.map((faq, i) => (
              <div key={i} style={s.faqCard}>
                <h3 style={s.faqQ}>{faq.q}</h3>
                <p style={s.faqA}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const Arrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const DOTS = Array.from({ length: 36 }, (_, i) => ({
  left: `${(i * 19 + 3) % 98}%`,
  top: `${(i * 27 + 5) % 94}%`,
  size: i % 5 === 0 ? 3 : 2,
  opacity: 0.1 + (i % 6) * 0.04,
  color: ["#3fffa2", "#4f8ef7", "#a78bfa", "#fca98d"][i % 4],
}));

const s: Record<string, React.CSSProperties> = {
  page: {
    position: "relative",
    background: "#0b1120",
    minHeight: "100vh",
    overflow: "hidden",
  },
  particles: { position: "absolute", inset: 0, pointerEvents: "none" },
  wave: {
    position: "absolute",
    top: 0,
    left: "-20%",
    right: "-20%",
    height: "50%",
    background: "linear-gradient(160deg, rgba(63,255,162,0.05) 0%, rgba(79,142,247,0.08) 35%, rgba(167,139,250,0.05) 65%, transparent 100%)",
    borderRadius: "0 0 60% 60%",
    filter: "blur(60px)",
    pointerEvents: "none",
  },
  inner: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1000,
    margin: "0 auto",
    padding: "100px 24px 120px",
  },

  // Header
  header: { textAlign: "center", marginBottom: 72 },
  eyebrow: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "#3fffa2",
    marginBottom: 20,
  },
  title: {
    fontSize: "clamp(34px, 5vw, 58px)",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.04em",
    lineHeight: 1.1,
    margin: "0 0 16px",
  },
  subtitle: {
    fontSize: 17,
    color: "#4a6490",
    margin: 0,
  },

  // Cards
  cardsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 64,
  },
  card: {
    background: "#0f1829",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: "32px 28px",
    display: "flex",
    flexDirection: "column" as const,
  },
  cardPro: {
    position: "relative",
    background: "#0f1829",
    border: "1px solid rgba(63,255,162,0.22)",
    borderRadius: 20,
    padding: "32px 28px",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  proGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    background: "radial-gradient(circle, rgba(63,255,162,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
    filter: "blur(20px)",
  },
  planBadge: {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: "#8fa3c8",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 6,
    padding: "3px 10px",
    marginBottom: 18,
    textTransform: "uppercase" as const,
    alignSelf: "flex-start",
  },
  proBadge: {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: "#3fffa2",
    background: "rgba(63,255,162,0.08)",
    border: "1px solid rgba(63,255,162,0.2)",
    borderRadius: 6,
    padding: "3px 10px",
    marginBottom: 18,
    textTransform: "uppercase" as const,
    alignSelf: "flex-start",
    position: "relative" as const,
  },
  planName: {
    fontSize: 26,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.02em",
    marginBottom: 4,
  },
  proPlanName: {
    fontSize: 26,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.02em",
  },
  planTagline: {
    fontSize: 14,
    color: "#4a6490",
    marginBottom: 12,
  },
  proPrice: {
    display: "flex",
    alignItems: "baseline",
    gap: 2,
    marginBottom: 12,
  },
  priceDollar: { fontSize: 20, fontWeight: 600, color: "#8fa3c8" },
  priceNum: {
    fontSize: 52,
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.04em",
    lineHeight: 1,
  },
  priceInterval: { fontSize: 14, color: "#4a6490", marginLeft: 4 },
  planDesc: {
    fontSize: 13,
    color: "#4a6490",
    lineHeight: 1.65,
    margin: "0 0 0",
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.05)",
    margin: "24px 0",
  },
  featureList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 11,
    flex: 1,
  },
  featureRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: "#8fa3c8",
    lineHeight: 1,
  },
  ctaWrap: {
    marginTop: 28,
    paddingTop: 24,
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  ghostBtn: {
    display: "block",
    textAlign: "center" as const,
    padding: "13px 0",
    borderRadius: 10,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
    transition: "all 0.15s",
    cursor: "pointer",
  },
  tealBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    width: "100%",
    padding: "13px 0",
    borderRadius: 10,
    background: "#3fffa2",
    color: "#0b1120",
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 24px rgba(63,255,162,0.25)",
    transition: "all 0.15s",
    fontFamily: "var(--font-sans)",
  },
  currentBadge: {
    textAlign: "center" as const,
    padding: "12px 0",
    fontSize: 13,
    fontWeight: 600,
    color: "#8fa3c8",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
  },
  currentBadgePro: {
    textAlign: "center" as const,
    padding: "12px 0",
    fontSize: 13,
    fontWeight: 600,
    color: "#3fffa2",
    background: "rgba(63,255,162,0.06)",
    border: "1px solid rgba(63,255,162,0.15)",
    borderRadius: 10,
  },

  // Compare strip
  compareStrip: {
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 80,
    display: "flex",
    flexDirection: "column-reverse" as const,
  },
  compareHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
  },
  compareRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 24px",
  },
  compareRowAlt: {
    background: "rgba(255,255,255,0.015)",
  },
  compareLabel: {
    fontSize: 13,
    color: "#8fa3c8",
    fontWeight: 500,
  },
  compareCols: {
    display: "flex",
    gap: 0,
  },
  compareCell: {
    width: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // FAQ
  faq: { maxWidth: 640, margin: "0 auto" },
  faqTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.03em",
    textAlign: "center" as const,
    marginBottom: 36,
  },
  faqList: { display: "flex", flexDirection: "column" as const, gap: 12 },
  faqCard: {
    background: "#0f1829",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: "24px",
  },
  faqQ: {
    fontSize: 15,
    fontWeight: 600,
    color: "#ffffff",
    marginBottom: 8,
    letterSpacing: "-0.01em",
  },
  faqA: {
    fontSize: 14,
    color: "#4a6490",
    lineHeight: 1.7,
    margin: 0,
  },
};
