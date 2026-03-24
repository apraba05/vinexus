"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";

// ── CAD prices ─────────────────────────────────────────────────────
const CAD_PRICES: Record<string, { monthly: number; annual: number }> = {
  free:       { monthly: 0,   annual: 0    },
  premium:    { monthly: 19,  annual: 159  },
  max:        { monthly: 49,  annual: 409  },
  "ai-pro":   { monthly: 99,  annual: 829  },
  enterprise: { monthly: -1,  annual: -1   },
};

// ── Pricing data ───────────────────────────────────────────────────
const PLANS = [
  {
    key: "free",
    name: "Free",
    monthly: "$0",
    annual: "$0",
    annualMonthly: "",
    annualSavings: "",
    period: "/month",
    desc: "Everything you need to connect to your first VM and start coding.",
    badge: null as string | null,
    highlight: false,
    cta: "Download Free",
    features: [
      "1 VM connection",
      "Monaco editor (full VS Code engine)",
      "Integrated terminal (real PTY over SSH)",
      "File explorer & SFTP",
      "Git source control",
      "Server management (systemctl, logs)",
      "No AI features",
      "Community support",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    monthly: "$19",
    annual: "$159",
    annualMonthly: "~$13/mo",
    annualSavings: "Save $69/yr",
    period: "/month",
    desc: "AI assistance and multi-VM workflows for productive developers.",
    badge: null as string | null,
    highlight: false,
    cta: "Get Premium",
    features: [
      "3 VM connections",
      "Claude Haiku AI (50 requests/day)",
      "Deploy automation",
      "Priority support",
    ],
  },
  {
    key: "max",
    name: "Max",
    monthly: "$49",
    annual: "$409",
    annualMonthly: "~$34/mo",
    annualSavings: "Save $179/yr",
    period: "/month",
    desc: "Full AI power for professionals managing multiple servers.",
    badge: "MOST POPULAR",
    highlight: true,
    cta: "Get Max",
    features: [
      "Unlimited VM connections",
      "Claude Sonnet AI (500 requests/day)",
      "AI file validation",
      "Custom deploy scripts",
      "Priority support",
    ],
  },
  {
    key: "ai-pro",
    name: "AI Pro",
    monthly: "$99",
    annual: "$829",
    annualMonthly: "~$69/mo",
    annualSavings: "Save $359/yr",
    period: "/month",
    desc: "Claude Opus 4.6 — Anthropic's most powerful model — for engineers who need the best.",
    badge: "OPUS POWERED" as string | null,
    highlight: false,
    cta: "Get AI Pro",
    features: [
      "Unlimited VM connections",
      "Claude Opus 4.6 AI (50 requests/day)",
      "AI file validation",
      "Custom deploy scripts",
      "Priority support",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthly: "Contact",
    annual: "Contact",
    annualMonthly: "",
    annualSavings: "",
    period: "",
    desc: "For teams with custom needs, SLAs, and enterprise security requirements.",
    badge: null as string | null,
    highlight: false,
    cta: "Contact Us",
    features: [
      "Unlimited AI requests",
      "Claude Opus 4.6",
      "Custom integrations",
      "SSO & team management",
      "On-premise deployment",
      "Dedicated support engineer",
      "SLA guarantee",
    ],
  },
];

type CellValue = boolean | string;
interface ComparisonRow {
  feature: string;
  free: CellValue; premium: CellValue; max: CellValue; "ai-pro": CellValue; enterprise: CellValue;
}

const COMPARISON: ComparisonRow[] = [
  { feature: "VM connections",       free: "1",     premium: "3",            max: "Unlimited",     "ai-pro": "Unlimited",     enterprise: "Unlimited"   },
  { feature: "AI model",             free: "None",  premium: "Haiku 4.5",    max: "Sonnet 4.6",    "ai-pro": "Opus 4.6",      enterprise: "Opus 4.6"    },
  { feature: "AI requests/day",      free: "0",     premium: "50",           max: "500",           "ai-pro": "50",            enterprise: "Unlimited"   },
  { feature: "Terminal",             free: true,    premium: true,           max: true,            "ai-pro": true,            enterprise: true          },
  { feature: "Monaco editor",        free: true,    premium: true,           max: true,            "ai-pro": true,            enterprise: true          },
  { feature: "File explorer / SFTP", free: true,    premium: true,           max: true,            "ai-pro": true,            enterprise: true          },
  { feature: "Git source control",   free: true,    premium: true,           max: true,            "ai-pro": true,            enterprise: true          },
  { feature: "Server management",    free: true,    premium: true,           max: true,            "ai-pro": true,            enterprise: true          },
  { feature: "Deploy automation",    free: false,   premium: true,           max: true,            "ai-pro": true,            enterprise: true          },
  { feature: "AI file validation",   free: false,   premium: false,          max: true,            "ai-pro": true,            enterprise: true          },
  { feature: "Priority support",     free: false,   premium: true,           max: true,            "ai-pro": true,            enterprise: true          },
  { feature: "SSO / Team mgmt",      free: false,   premium: false,          max: false,           "ai-pro": false,           enterprise: true          },
  { feature: "On-premise deploy",    free: false,   premium: false,          max: false,           "ai-pro": false,           enterprise: true          },
  { feature: "SLA guarantee",        free: false,   premium: false,          max: false,           "ai-pro": false,           enterprise: true          },
];

const FAQS = [
  { q: "Can I switch plans at any time?",        a: "Yes. Upgrades take effect immediately. Downgrades take effect at the end of your current billing cycle."                                                                                        },
  { q: "What payment methods do you accept?",    a: "All major credit cards — Visa, Mastercard, American Express. Enterprise plans can be invoiced on net-30."                                                                                       },
  { q: "Do you offer a free trial of paid plans?", a: "The Free plan is permanent — no credit card, no time limit. Upgrade when you need more VMs or AI features."                                                                                  },
  { q: "What happens to my data if I cancel?",   a: "Your data lives entirely on your VM. Vinexus never stores files, code, or credentials. Cancel any time — your VM is unaffected."                                                               },
  { q: "What is Claude Code?",                   a: "Claude Code is Anthropic's AI coding assistant. Install it on your VM, run it from the Vinexus terminal, and it can read files, write code, run tests, and fix bugs — with your approval."    },
  { q: "How does annual billing work?",          a: "Annual plans are billed once per year at a discounted rate — roughly 2 months free vs monthly. You can switch from monthly to annual at any time; we'll prorate the difference."               },
  { q: "What is AI Pro and how is it different from Max?", a: "AI Pro gives you Claude Opus 4.6 — Anthropic's most intelligent model — instead of Sonnet. It's best for complex infrastructure reasoning, architecture reviews, and nuanced debugging. Max has higher request volume (500/day) with Sonnet; AI Pro has 50 requests/day but each one is significantly more capable." },
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

  async function handleCheckout(planKey: string) {
    if (planKey === "free") { window.location.href = "/download"; return; }
    if (planKey === "enterprise") { window.location.href = "/contact"; return; }

    setCheckoutLoading(planKey);
    try {
      // Check auth first
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (!meData.user) {
        router.push(`/login?next=/pricing`);
        return;
      }

      // Create Stripe checkout session
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, billing }),
      });

      if (res.status === 401) {
        router.push(`/login?next=/pricing`);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  return (
    <div style={{ background: D.surface, color: D.onSurface }}>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section style={{ padding: "60px 24px 56px", textAlign: "center", borderBottom: `1px solid ${D.outlineVariant}` }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: D.primary, marginBottom: 16 }}>
          Pricing
        </p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em", lineHeight: 1.1, margin: "0 0 16px" }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 15, color: D.onSurfaceVariant, maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.65 }}>
          Start free. Upgrade when you need more power. No hidden fees.
        </p>

        {/* Billing toggle */}
        <div style={{ display: "inline-flex", borderRadius: 6, background: D.surfaceContainerHigh, padding: 3, gap: 2 }}>
          {(["monthly", "annual"] as const).map((b) => (
            <button key={b} onClick={() => setBilling(b)} style={{
              padding: "6px 18px", borderRadius: 4, border: "none",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: billing === b ? D.primary : "transparent",
              color: billing === b ? "#fff" : D.onSurfaceVariant,
              fontFamily: "inherit",
              transition: "background 0.15s, color 0.15s",
            }}>
              {b === "monthly" ? "Monthly" : "Annual"}
              {b === "annual" && (
                <span style={{
                  marginLeft: 6, fontSize: 10, background: "#15803d",
                  color: "#fff", padding: "2px 6px", borderRadius: 3,
                }}>
                  −17%
                </span>
              )}
            </button>
          ))}
        </div>

        {isAnnual && (
          <p style={{ fontSize: 12, color: D.onSurfaceVariant, marginTop: 10 }}>
            Billed annually · ~2 months free · All prices in CAD
          </p>
        )}
        {!isAnnual && (
          <p style={{ fontSize: 12, color: D.onSurfaceVariant, marginTop: 10 }}>
            All prices in CAD
          </p>
        )}
      </section>

      {/* ── Plan cards ─────────────────────────────────────────── */}
      <section style={{ padding: "56px 24px 72px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 14 }}>
            {PLANS.map((plan) => {
              const cadPrices  = CAD_PRICES[plan.key];
              const cadMonthly = cadPrices?.monthly ?? 0;
              const cadAnnual  = cadPrices?.annual  ?? 0;
              const rawPrice   = isAnnual ? cadAnnual : cadMonthly;
              const price      = rawPrice < 0 ? "Contact" : rawPrice === 0 ? "$0" : `$${rawPrice}`;
              const monthlyEquiv = cadAnnual > 0 ? `~$${Math.round(cadAnnual / 12)}/mo` : "";
              const subLabel   = isAnnual && plan.annualMonthly ? monthlyEquiv : "";
              const savings    = isAnnual && plan.annualSavings  ? plan.annualSavings  : "";
              const periodLabel = plan.key === "enterprise" ? "" : isAnnual && plan.key !== "free" ? "/year" : plan.key !== "free" ? "/month" : "";
              const isCurrent  = userPlan === plan.key;

              return (
                <div key={plan.key} style={{
                  background: plan.highlight ? D.surfaceLowest : D.surfaceContainerLow,
                  border: isCurrent ? `2px solid ${D.primary}` : plan.highlight ? `1px solid ${D.primary}` : `1px solid ${D.outlineVariant}`,
                  borderRadius: 8, padding: "28px 20px",
                  display: "flex", flexDirection: "column", position: "relative",
                }}>
                  {isCurrent && (
                    <div style={{
                      position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                      background: D.primary, color: "#fff",
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                      padding: "3px 12px", borderRadius: 4, whiteSpace: "nowrap",
                    }}>
                      YOUR PLAN
                    </div>
                  )}
                  {!isCurrent && plan.badge && (
                    <div style={{
                      position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                      background: D.primary, color: "#fff",
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                      padding: "3px 12px", borderRadius: 4, whiteSpace: "nowrap",
                    }}>
                      {plan.badge}
                    </div>
                  )}

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: D.inverseSurface, marginBottom: 5 }}>{plan.name}</div>
                    <p style={{ fontSize: 12, color: D.onSurfaceVariant, lineHeight: 1.6, margin: "0 0 12px" }}>{plan.desc}</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 30, fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em" }}>{price}</span>
                      {periodLabel && <span style={{ fontSize: 12, color: D.onSurfaceVariant }}>{periodLabel}</span>}
                    </div>
                    {subLabel && (
                      <div style={{ marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: D.onSurfaceVariant }}>{subLabel}</span>
                        {savings && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: D.success, background: `${D.success}15`, padding: "1px 6px", borderRadius: 3 }}>
                            {savings}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                    {plan.features.map((f) => (
                      <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: D.onSurface, lineHeight: 1.5 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={D.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {f}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => !isCurrent && handleCheckout(plan.key)}
                    disabled={isCurrent || checkoutLoading === plan.key}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "7px 14px", borderRadius: 4, fontSize: 13, fontWeight: 600,
                      cursor: isCurrent || checkoutLoading === plan.key ? "default" : "pointer",
                      opacity: checkoutLoading === plan.key ? 0.7 : 1,
                      fontFamily: "inherit",
                      background: isCurrent ? D.surfaceContainerHigh : plan.highlight ? D.primary : "transparent",
                      color: isCurrent ? D.onSurfaceVariant : plan.highlight ? "#ffffff" : D.onSurfaceVariant,
                      border: isCurrent ? `1px solid ${D.outlineVariant}` : plan.highlight ? "none" : `1px solid ${D.outlineVariant}`,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {checkoutLoading === plan.key ? "Loading…" : isCurrent ? "Current Plan" : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Feature comparison table ───────────────────────────── */}
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
                          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={D.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={D.outlineVariant} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      ) : (
                        <span style={{ fontSize: 12, color: (v === "None" || v === "0") ? D.onSurfaceVariant : D.onSurface, fontWeight: 500 }}>{v}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
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

      {/* ── Bottom CTA ─────────────────────────────────────────── */}
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
