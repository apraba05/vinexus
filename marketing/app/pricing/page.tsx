"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";

// ── Annual prices (roughly 2 months free) ───────────────────────────────────
const ANNUAL: Record<string, { price: string; perMonth: string; savings: string }> = {
  premium:    { price: "$190/yr", perMonth: "~$16/mo", savings: "Save $38/yr" },
  max:        { price: "$490/yr", perMonth: "~$41/mo", savings: "Save $98/yr" },
  "ai-pro":   { price: "$990/yr", perMonth: "~$83/mo", savings: "Save $198/yr" },
};

// ── Tier definitions ────────────────────────────────────────────────────────
interface Tier {
  key: string;
  name: string;
  price: string;
  period: string;
  model: string | null;
  tokens: string | null;
  inheritLabel: string | null;
  features: string[];
  cta: string;
  popular?: boolean;
  enterprise?: boolean;
}

const TIERS: Tier[] = [
  {
    key: "free",
    name: "Free",
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
  },
  {
    key: "premium",
    name: "Premium",
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
    name: "Max",
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
    name: "AI Pro",
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
    name: "Enterprise",
    price: "Contact us",
    period: "",
    model: "Claude Opus",
    tokens: "Custom token allocation",
    inheritLabel: "Everything in AI Pro, plus",
    features: [
      "Custom token allocation",
      "SSO & access controls",
      "On-premise deployment",
      "Custom integrations",
      "Dedicated support engineer",
      "SLA guarantee",
    ],
    cta: "Contact us",
    enterprise: true,
  },
];

// ── Comparison table ─────────────────────────────────────────────────────────
type CellValue = boolean | string;
interface ComparisonRow {
  feature: string;
  free: CellValue; premium: CellValue; max: CellValue; "ai-pro": CellValue; enterprise: CellValue;
}

const COMPARISON: ComparisonRow[] = [
  { feature: "VM connections",           free: "1",     premium: "3",         max: "Unlimited",   "ai-pro": "Unlimited",   enterprise: "Unlimited"   },
  { feature: "AI model",                 free: "None",  premium: "Haiku",     max: "Sonnet",      "ai-pro": "Sonnet",      enterprise: "Opus"        },
  { feature: "Token budget / month",     free: "—",     premium: "5M",        max: "10M",         "ai-pro": "30M",         enterprise: "Custom"      },
  { feature: "Terminal",                 free: true,    premium: true,        max: true,          "ai-pro": true,          enterprise: true          },
  { feature: "Monaco editor",           free: true,    premium: true,        max: true,          "ai-pro": true,          enterprise: true          },
  { feature: "File explorer / SFTP",     free: true,    premium: true,        max: true,          "ai-pro": true,          enterprise: true          },
  { feature: "Git source control",       free: true,    premium: true,        max: true,          "ai-pro": true,          enterprise: true          },
  { feature: "Server management",        free: true,    premium: true,        max: true,          "ai-pro": true,          enterprise: true          },
  { feature: "Deploy automation",        free: false,   premium: true,        max: true,          "ai-pro": true,          enterprise: true          },
  { feature: "AI file validation",       free: false,   premium: true,        max: true,          "ai-pro": true,          enterprise: true          },
  { feature: "Docker management",        free: false,   premium: false,       max: true,          "ai-pro": true,          enterprise: true          },
  { feature: "Deployment pipelines",     free: false,   premium: false,       max: true,          "ai-pro": true,          enterprise: true          },
  { feature: "Infra monitoring",         free: false,   premium: false,       max: false,         "ai-pro": true,          enterprise: true          },
  { feature: "Team collaboration",       free: false,   premium: false,       max: false,         "ai-pro": true,          enterprise: true          },
  { feature: "SSO & access controls",    free: false,   premium: false,       max: false,         "ai-pro": false,         enterprise: true          },
  { feature: "On-premise deployment",    free: false,   premium: false,       max: false,         "ai-pro": false,         enterprise: true          },
  { feature: "SLA guarantee",            free: false,   premium: false,       max: false,         "ai-pro": false,         enterprise: true          },
];

const FAQS = [
  { q: "Can I switch plans at any time?",        a: "Yes. Upgrades take effect immediately. Downgrades take effect at the end of your current billing cycle." },
  { q: "What payment methods do you accept?",    a: "All major credit cards — Visa, Mastercard, American Express. Enterprise plans can be invoiced on net-30." },
  { q: "Do you offer a free trial of paid plans?", a: "The Free plan is permanent — no credit card, no time limit. Upgrade when you need more VMs or AI features." },
  { q: "What happens to my data if I cancel?",   a: "Your data lives entirely on your VM. Vinexus never stores files, code, or credentials. Cancel any time — your VM is unaffected." },
  { q: "What counts as a token?",                a: "Tokens are the unit of AI usage. Every message you send and receive consumes tokens. A typical AI coding interaction uses ~2 000–5 000 tokens. Unused tokens don't roll over." },
  { q: "Can I buy more tokens?",                 a: "Yes. On AI Pro you can purchase token top-ups at any time from your account settings without changing your plan." },
  { q: "What is the difference between Max and AI Pro?", a: "Max gives you 10M tokens/month with Claude Sonnet — great for most development workflows. AI Pro gives you 30M tokens/month plus infrastructure monitoring, team collaboration, and advanced AI diagnostics." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const { D } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${D.outlineVariant}` }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "18px 0",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "none", border: "none", color: D.inverseSurface,
        fontSize: 14, fontWeight: 500, cursor: "pointer", textAlign: "left",
        gap: 16, fontFamily: "inherit",
      }}>
        {q}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && <div style={{ paddingBottom: 18, fontSize: 13, color: D.onSurfaceVariant, lineHeight: 1.75 }}>{a}</div>}
    </div>
  );
}

export default function PricingPage() {
  const { D } = useTheme();
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const isAnnual = billing === "annual";

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(data => {
      if (data.user?.plan) setUserPlan(data.user.plan);
    }).catch(() => {});
  }, []);

  async function handleCheckout(tier: Tier) {
    if (tier.key === "free") { window.location.href = "/download"; return; }
    if (tier.enterprise) { window.location.href = "/contact"; return; }

    setCheckoutLoading(tier.key);
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (!meData.user) { router.push(`/login?next=/pricing`); return; }

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey: tier.key, billing }),
      });
      if (res.status === 401) { router.push(`/login?next=/pricing`); return; }
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { alert(data.error || "Failed to start checkout. Please try again."); }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  return (
    <div style={{ background: D.surface, color: D.onSurface }}>

      {/* ── Hero ── */}
      <section style={{ padding: "60px 24px 56px", textAlign: "center", borderBottom: `1px solid ${D.outlineVariant}` }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: D.primary, marginBottom: 16 }}>
          Pricing
        </p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em", lineHeight: 1.1, margin: "0 0 16px" }}>
          A plan for every team
        </h1>
        <p style={{ fontSize: 15, color: D.onSurfaceVariant, maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.65 }}>
          Start free. Upgrade as your AI usage grows. Cancel anytime.
        </p>

        {/* Billing toggle */}
        <div style={{ display: "inline-flex", borderRadius: 6, background: D.surfaceContainerHigh, padding: 3, gap: 2 }}>
          {(["monthly", "annual"] as const).map((b) => (
            <button key={b} onClick={() => setBilling(b)} style={{
              padding: "6px 18px", borderRadius: 4, border: "none",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: billing === b ? D.primary : "transparent",
              color: billing === b ? "#fff" : D.onSurfaceVariant,
              fontFamily: "inherit", transition: "background 0.15s, color 0.15s",
            }}>
              {b === "monthly" ? "Monthly" : "Annual"}
              {b === "annual" && (
                <span style={{ marginLeft: 6, fontSize: 10, background: "#15803d", color: "#fff", padding: "2px 6px", borderRadius: 3 }}>
                  −17%
                </span>
              )}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: D.onSurfaceVariant, marginTop: 10 }}>
          {isAnnual ? "Billed annually · ~2 months free" : "Billed monthly · Switch to annual to save"}
        </p>
      </section>

      {/* ── Plan cards ── */}
      <section style={{ padding: "56px 0 72px", overflowX: "auto" }}>
        <div style={{ minWidth: 1000, maxWidth: 1300, margin: "0 auto", padding: "20px 24px 0" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 12,
          }}>
            {TIERS.map((tier) => {
              const isCurrent = userPlan === tier.key;
              const isPopular = !!tier.popular;

              return (
                <div key={tier.key} style={{
                  display: "flex", flexDirection: "column",
                  borderRadius: 10,
                  border: isCurrent
                    ? `2px solid ${D.primary}`
                    : isPopular
                      ? `2px solid ${D.primary}`
                      : `1px solid ${D.outlineVariant}`,
                  background: isPopular ? D.surfaceContainerHigh : D.surfaceContainerLow,
                  padding: "24px 18px",
                  position: "relative",
                  boxShadow: isPopular ? `0 0 0 4px ${D.primary}10` : "none",
                }}>
                  {/* Badge */}
                  {(isCurrent || isPopular) && (
                    <div style={{
                      position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                      background: D.primary, color: "#fff",
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                      textTransform: "uppercase", padding: "3px 10px", borderRadius: 9999,
                      whiteSpace: "nowrap",
                    }}>
                      {isCurrent ? "Your plan" : "Most Popular"}
                    </div>
                  )}

                  {/* Tier name */}
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: isPopular ? D.primary : D.onSurfaceVariant,
                    marginBottom: 10,
                  }}>
                    {tier.name}
                  </div>

                  {/* Price */}
                  {(() => {
                    const ann = ANNUAL[tier.key];
                    const showAnnual = isAnnual && ann;
                    return (
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 28, fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.03em", lineHeight: 1 }}>
                          {showAnnual ? ann.price : tier.price}
                        </span>
                        {!showAnnual && tier.period && (
                          <span style={{ fontSize: 12, color: D.onSurfaceVariant, marginLeft: 4 }}>{tier.period}</span>
                        )}
                        {showAnnual && (
                          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, color: D.onSurfaceVariant }}>{ann.perMonth}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#15803d", background: "rgba(21,128,61,0.1)", padding: "1px 6px", borderRadius: 3 }}>
                              {ann.savings}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Model + tokens subtitle */}
                  <div style={{ minHeight: 36, marginBottom: 16 }}>
                    {tier.tokens ? (
                      <div style={{ fontSize: 11, color: D.onSurfaceVariant, lineHeight: 1.5 }}>{tier.tokens}</div>
                    ) : null}
                    {tier.model ? (
                      <div style={{ fontSize: 11, fontWeight: 600, color: isPopular ? D.primary : D.onSurfaceVariant, opacity: 0.85 }}>
                        {tier.model}
                      </div>
                    ) : (
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

                  {/* Features */}
                  <ul style={{ listStyle: "none", margin: "0 0 auto", padding: 0, flex: 1 }}>
                    {tier.features.map((feat) => (
                      <li key={feat} style={{
                        display: "flex", alignItems: "flex-start", gap: 7,
                        fontSize: 12, color: D.onSurface, lineHeight: 1.55, marginBottom: 6,
                      }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isPopular ? D.primary : (D as any).success ?? "#3fb950"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div style={{ marginTop: 20 }}>
                    <button
                      onClick={() => !isCurrent && handleCheckout(tier)}
                      disabled={isCurrent || checkoutLoading === tier.key}
                      style={{
                        width: "100%", padding: "9px 0", borderRadius: 8,
                        fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                        cursor: isCurrent || checkoutLoading === tier.key ? "default" : "pointer",
                        opacity: checkoutLoading === tier.key ? 0.7 : 1,
                        transition: "opacity 0.15s",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        ...(isCurrent
                          ? { background: "transparent", color: D.onSurfaceVariant, border: `1px solid ${D.outlineVariant}` }
                          : isPopular
                            ? { background: D.primary, color: "#fff", border: "none" }
                            : tier.enterprise
                              ? { background: "transparent", color: D.inverseSurface, border: `1.5px solid ${D.outlineVariant}` }
                              : { background: D.surfaceContainerHigh, color: D.inverseSurface, border: `1px solid ${D.outlineVariant}` }),
                      }}
                    >
                      {checkoutLoading === tier.key
                        ? <Spinner />
                        : isCurrent ? "Current plan" : tier.cta}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Feature comparison table ── */}
      <section style={{ background: D.surfaceContainerLow, borderTop: `1px solid ${D.outlineVariant}`, borderBottom: `1px solid ${D.outlineVariant}`, padding: "72px 24px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.03em", textAlign: "center", margin: "0 0 40px" }}>
            Compare all features
          </h2>
          <div style={{ border: `1px solid ${D.outlineVariant}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
              background: D.surfaceLowest, borderBottom: `1px solid ${D.outlineVariant}`,
              padding: "14px 20px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: D.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em" }}>Feature</div>
              {(["Free", "Premium", "Max", "AI Pro", "Enterprise"] as const).map((name, i) => (
                <div key={i} style={{ fontSize: 13, fontWeight: 700, color: i === 2 ? D.primary : D.inverseSurface, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  {name}
                  {i === 2 && <span style={{ fontSize: 9, background: D.primary, color: "#fff", padding: "2px 5px", borderRadius: 3, fontWeight: 700 }}>HOT</span>}
                </div>
              ))}
            </div>
            {COMPARISON.map((row, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
                padding: "12px 20px",
                borderBottom: i < COMPARISON.length - 1 ? `1px solid ${D.outlineVariant}` : "none",
                background: i % 2 === 0 ? "transparent" : D.surfaceContainerLow,
              }}>
                <div style={{ fontSize: 13, color: D.onSurface, fontWeight: 500 }}>{row.feature}</div>
                {(["free", "premium", "max", "ai-pro", "enterprise"] as const).map((plan) => {
                  const v = row[plan];
                  return (
                    <div key={plan} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                      {typeof v === "boolean" ? (
                        v
                          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={(D as any).success ?? "#3fb950"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={D.outlineVariant} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      ) : (
                        <span style={{ fontSize: 12, color: (v === "None" || v === "0" || v === "—") ? D.onSurfaceVariant : D.onSurface, fontWeight: 500 }}>{v}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: "80px 24px", background: D.surface }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.03em", textAlign: "center", margin: "0 0 48px" }}>
            Frequently asked questions
          </h2>
          <div style={{ borderTop: `1px solid ${D.outlineVariant}` }}>
            {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{ background: D.surfaceContainerLow, borderTop: `1px solid ${D.outlineVariant}`, padding: "72px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(22px, 3vw, 38px)", fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em", margin: "0 0 14px" }}>
          Start for free today
        </h2>
        <p style={{ fontSize: 14, color: D.onSurfaceVariant, margin: "0 auto 28px", maxWidth: 380, lineHeight: 1.65 }}>
          Download Vinexus and connect to your first VM in under 5 minutes. No credit card required.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/download" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 16px", borderRadius: 4, fontWeight: 600, fontSize: 13,
            textDecoration: "none", background: D.primary, color: "#fff",
          }}>
            Download Free
          </Link>
          <Link href="/contact" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 16px", borderRadius: 4, fontWeight: 600, fontSize: 13,
            textDecoration: "none", background: "transparent", color: D.onSurfaceVariant,
          }}>
            Contact Sales
          </Link>
        </div>
      </section>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 12, height: 12,
      border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "currentColor",
      borderRadius: "50%", animation: "spin 0.7s linear infinite",
    }} />
  );
}
