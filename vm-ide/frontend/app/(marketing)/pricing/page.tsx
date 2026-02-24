"use client";
import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { usePlan } from "@/contexts/PlanContext";

const GradientText = dynamic(() => import("@/components/reactbits/GradientText"), { ssr: false });
const CountUp = dynamic(() => import("@/components/reactbits/CountUp"), { ssr: false });

const plans = [
  {
    name: "Free",
    price: 0,
    interval: "forever",
    description: "Get started with the essentials",
    features: [
      { text: "Monaco Code Editor", included: true },
      { text: "Integrated Terminal (SSH)", included: true },
      { text: "File Management", included: true },
      { text: "One-Click Deploy", included: false },
      { text: "Server Commands", included: false },
      { text: "AI Insights & Diagnostics", included: false },
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: 10,
    interval: "/month",
    description: "Unlock the full power of InfraNexus",
    features: [
      { text: "Everything in Free", included: true },
      { text: "One-Click Deploy", included: true },
      { text: "Server Commands", included: true },
      { text: "AI File Analysis (15/day)", included: true },
      { text: "AI Log Diagnosis (15/day)", included: true },
      { text: "AI Config Validation (15/day)", included: true },
      { text: "Priority Support", included: true },
    ],
    highlight: true,
  },
];

const faqs = [
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
    <div style={{ padding: "80px 24px 120px" }}>
      <div className="section-header" style={{ marginBottom: 64 }}>
        <GradientText
          colors={["#06b6d4", "#22d3ee", "#67e8f9", "#06b6d4"]}
          animationSpeed={6}
        >
          <h1 className="section-title" style={{ fontSize: 42 }}>Simple, transparent pricing</h1>
        </GradientText>
        <p className="section-subtitle">
          Start free. Upgrade when you need Pro features.
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 24,
        maxWidth: 800,
        margin: "0 auto",
      }}>
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`pricing-card ${plan.highlight ? "pricing-card-highlight" : ""}`}
          >
            {plan.highlight && (
              <div style={{
                position: "absolute",
                top: -12,
                left: "50%",
                transform: "translateX(-50%)",
                padding: "6px 18px",
                background: "var(--gradient-brand)",
                color: "#fff",
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase" as const,
                letterSpacing: "0.05em",
              }}>
                Most Popular
              </div>
            )}

            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-bright)", marginBottom: 8 }}>
              {plan.name}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 600, color: "var(--text-secondary)" }}>$</span>
              <span style={{ fontSize: 52, fontWeight: 800, color: "var(--text-bright)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                <CountUp to={plan.price} duration={1.5} />
              </span>
              <span style={{ fontSize: 15, color: "var(--text-secondary)", marginLeft: 4 }}>{plan.interval}</span>
            </div>

            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 24px" }}>
              {plan.description}
            </p>

            <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 24 }} />

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
              {plan.features.map((f, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: f.included ? 1 : 0.35 }}>
                  <span style={{ display: "flex", alignItems: "center", flexShrink: 0, color: f.included ? "var(--accent)" : "var(--text-muted)" }}>
                    {f.included ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </span>
                  <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{f.text}</span>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: "auto", paddingTop: 28 }}>
              {plan.highlight ? (
                session ? (
                  isPro ? (
                    <div className="badge badge-accent" style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 14 }}>
                      Current Plan
                    </div>
                  ) : (
                    <button className="btn btn-primary" style={{ width: "100%", padding: "14px 0" }} onClick={handleUpgrade}>
                      Upgrade to Pro
                    </button>
                  )
                ) : (
                  <Link href="/signup" className="btn btn-primary" style={{ width: "100%", padding: "14px 0" }}>
                    Get Started
                  </Link>
                )
              ) : (
                session ? (
                  !isPro ? (
                    <div className="badge badge-accent" style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 14 }}>
                      Current Plan
                    </div>
                  ) : (
                    <div className="badge badge-neutral" style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 14, opacity: 0.5 }}>
                      Free Tier
                    </div>
                  )
                ) : (
                  <Link href="/signup" className="btn btn-secondary" style={{ width: "100%", padding: "14px 0" }}>
                    Get Started
                  </Link>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 640, margin: "100px auto 0" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-bright)", textAlign: "center", marginBottom: 40 }}>
          Frequently asked questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {faqs.map((faq, i) => (
            <div key={i} className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-bright)", marginBottom: 8 }}>
                {faq.q}
              </h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
