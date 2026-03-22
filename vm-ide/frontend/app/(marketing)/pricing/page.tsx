"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTheme } from "@/lib/ThemeContext";

const PLANS = [
  {
    name: "free",
    label: "Free",
    badge: "Get Started",
    price: { monthly: 0, annual: 0 },
    desc: "For anyone who wants to connect and explore their VMs from the browser.",
    features: [
      "Monaco Code Editor",
      "Integrated SSH Terminal",
      "File Management",
      "1 VM Connection",
      "Multi-tab editing",
    ],
    locked: ["One-Click Deploy", "AI Features", "Priority Support"],
    cta: "Get Started Free",
    ctaHref: "/signup",
    highlight: false,
  },
  {
    name: "premium",
    label: "Premium",
    badge: "Popular",
    price: { monthly: 19, annual: 15 },
    desc: "For developers who need AI assistance and more connections.",
    features: [
      "Everything in Free",
      "3 VM Connections",
      "One-Click Deploy",
      "Server Commands",
      "AI File Analysis (50/day)",
      "Claude Haiku model",
    ],
    locked: [],
    cta: "Get Premium",
    ctaHref: "/signup",
    highlight: false,
  },
  {
    name: "max",
    label: "Max",
    badge: "Recommended",
    price: { monthly: 49, annual: 39 },
    desc: "Unlimited VMs, faster AI, and priority support.",
    features: [
      "Everything in Premium",
      "Unlimited VM Connections",
      "AI Insights (500/day)",
      "Claude Sonnet model",
      "Priority Support",
      "Deploy Automation",
    ],
    locked: [],
    cta: "Get Max",
    ctaHref: "/signup",
    highlight: true,
  },
  {
    name: "ai-pro",
    label: "AI Pro",
    badge: "Most Powerful",
    price: { monthly: 99, annual: 79 },
    desc: "For teams that need the most powerful AI available.",
    features: [
      "Everything in Max",
      "Claude Opus model",
      "50 AI requests/day",
      "Unlimited VM Connections",
      "Deploy Automation",
      "Priority Support",
    ],
    locked: [],
    cta: "Get AI Pro",
    ctaHref: "/signup",
    highlight: false,
  },
  {
    name: "enterprise",
    label: "Enterprise",
    badge: "Custom",
    price: null,
    desc: "Custom limits, dedicated support, and SLA guarantees for your team.",
    features: [
      "Everything in AI Pro",
      "Unlimited AI requests",
      "Claude Opus model",
      "Dedicated support",
      "Custom SLA",
      "SSO / SAML",
    ],
    locked: [],
    cta: "Contact Us",
    ctaHref: "mailto:support@vinexus.space",
    highlight: false,
  },
];

const Check = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="7" cy="7" r="6.5" stroke={color} strokeOpacity="0.3" />
    <polyline points="4 7 6 9 10 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Lock = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.3 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function PricingPage() {
  const { D, isDark } = useTheme();
  const { data: session } = useSession();
  const [annual, setAnnual] = useState(false);

  return (
    <div style={{ background: D.surface, minHeight: "100vh" }}>
      {/* Glow */}
      <div aria-hidden style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 800, height: 500,
        background: `radial-gradient(ellipse at 50% 0%, ${D.primary}12 0%, transparent 70%)`,
        filter: "blur(80px)", pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1160, margin: "0 auto", padding: "80px 24px 120px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: D.primary, marginBottom: 16 }}>
            Pricing
          </p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 54px)", fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em", lineHeight: 1.1, margin: "0 0 16px" }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: 16, color: D.onSurfaceVariant, margin: "0 auto 36px", maxWidth: 480 }}>
            Start free. Upgrade when you need more power.
          </p>

          {/* Billing toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: D.surfaceContainerHigh, border: `1px solid ${D.outlineVariant}`, borderRadius: 99, padding: "6px 16px" }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: !annual ? D.onSurface : D.onSurfaceVariant }}>Monthly</span>
            <button
              onClick={() => setAnnual(v => !v)}
              style={{
                width: 40, height: 22, borderRadius: 99, border: "none", cursor: "pointer",
                background: annual ? D.primary : D.outlineVariant,
                position: "relative", transition: "background 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: 3, left: annual ? 21 : 3,
                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s",
              }} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 500, color: annual ? D.onSurface : D.onSurfaceVariant }}>
              Annual <span style={{ fontSize: 11, color: D.primary, fontWeight: 700 }}>−20%</span>
            </span>
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, alignItems: "start" }}>
          {PLANS.map((plan) => {
            const isHighlight = plan.highlight;
            return (
              <div key={plan.name} style={{
                background: isHighlight ? D.primaryContainer : D.surfaceContainerLow,
                border: `1px solid ${isHighlight ? D.primary : D.outlineVariant}`,
                borderRadius: 16,
                padding: "28px 22px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                boxShadow: isHighlight ? `0 0 40px ${D.primary}22` : "none",
              }}>
                {/* Badge */}
                <div style={{
                  display: "inline-block", alignSelf: "flex-start",
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                  color: isHighlight ? D.primary : D.onSurfaceVariant,
                  background: isHighlight ? `${D.primary}18` : D.surfaceContainerHigh,
                  border: `1px solid ${isHighlight ? `${D.primary}44` : D.outlineVariant}`,
                  borderRadius: 6, padding: "3px 10px", marginBottom: 16,
                }}>
                  {plan.badge}
                </div>

                <div style={{ fontSize: 20, fontWeight: 700, color: D.inverseSurface, marginBottom: 8, letterSpacing: "-0.02em" }}>
                  {plan.label}
                </div>

                {/* Price */}
                {plan.price === null ? (
                  <div style={{ fontSize: 28, fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.03em", marginBottom: 4 }}>
                    Custom
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: D.onSurfaceVariant }}>CA$</span>
                    <span style={{ fontSize: 40, fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em", lineHeight: 1 }}>
                      {annual ? plan.price.annual : plan.price.monthly}
                    </span>
                    <span style={{ fontSize: 13, color: D.onSurfaceVariant, marginLeft: 2 }}>/mo</span>
                  </div>
                )}
                {annual && plan.price !== null && plan.price.monthly > 0 && (
                  <div style={{ fontSize: 11, color: D.onSurfaceVariant, marginBottom: 4 }}>
                    Billed CA${plan.price.annual * 12}/year
                  </div>
                )}

                <p style={{ fontSize: 12, color: D.onSurfaceVariant, lineHeight: 1.6, margin: "10px 0 18px" }}>
                  {plan.desc}
                </p>

                <div style={{ height: 1, background: D.outlineVariant, opacity: 0.5, marginBottom: 18 }} />

                <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1, marginBottom: 24 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Check color={isHighlight ? D.primary : D.primary} />
                      <span style={{ fontSize: 12, color: D.onSurface }}>{f}</span>
                    </div>
                  ))}
                  {plan.locked.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Lock color={D.onSurfaceVariant} />
                      <span style={{ fontSize: 12, color: D.onSurfaceVariant, opacity: 0.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {plan.name === "enterprise" ? (
                  <a href={plan.ctaHref} style={{
                    display: "block", textAlign: "center",
                    padding: "11px 0", borderRadius: 8,
                    background: D.surfaceContainerHigh, color: D.onSurface,
                    border: `1px solid ${D.outlineVariant}`,
                    fontSize: 13, fontWeight: 600, textDecoration: "none",
                  }}>
                    {plan.cta}
                  </a>
                ) : (
                  <Link href={session ? "/dashboard" : plan.ctaHref} style={{
                    display: "block", textAlign: "center",
                    padding: "11px 0", borderRadius: 8,
                    background: isHighlight ? D.primary : D.surfaceContainerHigh,
                    color: isHighlight ? "#fff" : D.onSurface,
                    border: `1px solid ${isHighlight ? D.primary : D.outlineVariant}`,
                    fontSize: 13, fontWeight: 600, textDecoration: "none",
                    boxShadow: isHighlight ? `0 4px 20px ${D.primary}44` : "none",
                  }}>
                    {plan.cta}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 640, margin: "80px auto 0" }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: D.inverseSurface, textAlign: "center", letterSpacing: "-0.03em", marginBottom: 32 }}>
            Frequently asked questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { q: "Can I upgrade or downgrade at any time?", a: "Yes. Upgrade instantly and get new features right away. Downgrade anytime — you keep access until the end of your billing period." },
              { q: "What payment methods do you accept?", a: "We use Stripe for billing. You can pay with any major credit or debit card." },
              { q: "Is there a free trial?", a: "The Free plan has no time limit. Start there and upgrade whenever you're ready." },
              { q: "What is the Enterprise plan?", a: "Enterprise is a custom plan for teams. Contact us at support@vinexus.space and we'll put together a package for your needs." },
            ].map((faq, i) => (
              <div key={i} style={{
                background: D.surfaceContainerLow, border: `1px solid ${D.outlineVariant}`,
                borderRadius: 12, padding: "22px 24px",
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: D.onSurface, marginBottom: 8, letterSpacing: "-0.01em" }}>{faq.q}</h3>
                <p style={{ fontSize: 13, color: D.onSurfaceVariant, lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
