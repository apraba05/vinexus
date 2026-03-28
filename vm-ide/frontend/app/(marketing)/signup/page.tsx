"use client";
import React, { useState, useEffect, Suspense } from "react";
import { getSession, signIn, useSession } from "next-auth/react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { useRouter, useSearchParams } from "next/navigation";

// ── Color tokens ──────────────────────────────────────────────────
const C = {
  bgBase:      "#f9f9ff",
  bgSurface:   "#f1f3ff",
  bgElevated:  "#ffffff",
  border:      "rgba(155,178,229,0.35)",
  textBright:  "#070e1d",
  textPrimary: "#19315d",
  textMuted:   "#9bb2e5",
  accent:      "#0053db",
  accentLight: "#4f8ef7",
  accentGlow:  "rgba(0,83,219,0.1)",
  danger:      "#b91c1c",
  success:     "#15803d",
};

type Plan = "free" | "premium" | "max" | "ai-pro" | "enterprise";

const PLANS: { key: Plan; name: string; price: string; desc: string; features: string[]; highlight: boolean }[] = [
  {
    key: "free",
    name: "Free",
    price: "$0/month",
    desc: "Core IDE + AI included",
    highlight: false,
    features: ["1 VM connection", "Llama 3.1 8B AI", "500K tokens/month", "20 req/day"],
  },
  {
    key: "premium",
    name: "Premium",
    price: "$19/month",
    desc: "Multi-VM + Claude Haiku",
    highlight: false,
    features: ["3 VM connections", "Claude Haiku AI", "3M tokens/month", "Deploy automation"],
  },
  {
    key: "max",
    name: "Max",
    price: "$49/month",
    desc: "Full AI, unlimited VMs",
    highlight: true,
    features: ["Unlimited VMs", "Claude Sonnet AI", "8M tokens/month", "Priority support"],
  },
  {
    key: "ai-pro",
    name: "AI Pro",
    price: "$99/month",
    desc: "Heavy AI workloads",
    highlight: false,
    features: ["Unlimited VMs", "Claude Sonnet AI", "20M tokens/month", "AI developer agent"],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "Contact us",
    desc: "Teams & custom needs",
    highlight: false,
    features: ["Unlimited AI", "Claude Opus AI", "SSO & team mgmt", "SLA guarantee"],
  },
];

export default function SignupPageWrapper() {
  return (
    <Suspense fallback={<div style={{ background: "#070e1d", minHeight: "100vh" }} />}>
      <SignupPage />
    </Suspense>
  );
}

function SignupPage() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") as Plan | null;

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan>(planParam ?? "free");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // If plan param is provided, skip to step 2
  useEffect(() => {
    if (planParam && planParam !== "enterprise") {
      setSelectedPlan(planParam);
      setStep(2);
    }
  }, [planParam]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  const handlePlanSelect = (plan: Plan) => {
    if (plan === "enterprise") {
      window.location.href = "/contact";
      return;
    }
    setSelectedPlan(plan);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, plan: selectedPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please log in.");
        setLoading(false);
      } else {
        await getSession();
        router.replace(result?.url ?? "/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "11px 14px",
    background: C.bgBase,
    color: C.textBright,
    border: `1px solid ${focused ? C.accentLight : C.border}`,
    borderRadius: 9,
    fontSize: 14,
    outline: "none",
    boxShadow: focused ? `0 0 0 3px rgba(59,130,246,0.12)` : "none",
    transition: "all 0.15s",
    fontFamily: "inherit",
  });

  return (
    <div style={{
      minHeight: "calc(100vh - 64px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 24px",
      background: C.bgBase,
    }}>
      {/* Background glow */}
      <div aria-hidden style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 600, height: 400,
        background: "radial-gradient(ellipse at 50% 0%, rgba(0,83,219,0.12) 0%, transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />

      <div style={{
        display: "flex", flexDirection: "column" as const,
        alignItems: "center", width: "100%",
        maxWidth: step === 1 ? 860 : 420,
        position: "relative" as const, zIndex: 1,
        transition: "max-width 0.3s ease",
      }}>

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", marginBottom: 10 }}>
          <BrandLogo iconSize={28} textSize={26} textColor={C.textBright} muted />
        </Link>
        <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 36 }}>
          {step === 1 ? "Choose a plan to get started" : "Create your account"}
        </p>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: step >= s ? C.accent : "transparent",
                border: `1px solid ${step >= s ? C.accent : C.border}`,
                fontSize: 12, fontWeight: 700,
                color: step >= s ? "#fff" : C.textMuted,
              }}>
                {s}
              </div>
              {s < 2 && <div style={{ width: 40, height: 1, background: step > s ? C.accent : C.border }} />}
            </React.Fragment>
          ))}
          <span style={{ marginLeft: 8, fontSize: 12, color: C.textMuted }}>
            {step === 1 ? "Select plan" : "Account details"}
          </span>
        </div>

        {/* ── STEP 1: Plan selection ── */}
        {step === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, width: "100%" }}>
            {PLANS.map((plan) => (
              <button
                key={plan.key}
                onClick={() => handlePlanSelect(plan.key)}
                style={{
                  background: plan.highlight ? C.bgElevated : C.bgSurface,
                  border: plan.highlight ? "1px solid rgba(0,83,219,0.4)" : `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "24px 20px",
                  display: "flex", flexDirection: "column" as const,
                  cursor: "pointer",
                  textAlign: "left" as const,
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                  boxShadow: plan.highlight ? `0 8px 32px rgba(0,83,219,0.1)` : "none",
                  position: "relative" as const,
                }}
              >
                {plan.highlight && (
                  <div style={{
                    position: "absolute" as const, top: -12, left: "50%", transform: "translateX(-50%)",
                    background: C.accent, color: "#fff",
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                    padding: "3px 12px", borderRadius: 6, whiteSpace: "nowrap" as const,
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontSize: 16, fontWeight: 700, color: C.textBright, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: plan.highlight ? C.accentLight : C.textPrimary, marginBottom: 8 }}>{plan.price}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 18, lineHeight: 1.5 }}>{plan.desc}</div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, flex: 1 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.textPrimary }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {f}
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 20, padding: "9px 0",
                  background: plan.highlight ? C.accent : "transparent",
                  border: plan.highlight ? "none" : `1px solid ${C.border}`,
                  borderRadius: 6, fontSize: 13, fontWeight: 700,
                  color: plan.highlight ? "#fff" : C.textPrimary,
                  textAlign: "center" as const,
                }}>
                  {plan.key === "enterprise" ? "Contact Us" : `Select ${plan.name}`}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── STEP 2: Account creation form ── */}
        {step === 2 && (
          <div style={{ width: "100%" }}>
            {/* Selected plan badge */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px",
              background: "rgba(0,83,219,0.08)", border: "1px solid rgba(0,83,219,0.2)",
              borderRadius: 10, marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: 13, color: C.textPrimary, fontWeight: 500 }}>
                  Plan: <strong style={{ color: C.textBright }}>{PLANS.find(p => p.key === selectedPlan)?.name}</strong>
                  {" "}— {PLANS.find(p => p.key === selectedPlan)?.price}
                </span>
              </div>
              <button
                onClick={() => setStep(1)}
                style={{ fontSize: 12, color: C.accentLight, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
              >
                Change
              </button>
            </div>

            {/* Card */}
            <div style={{
              background: C.bgSurface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "28px 28px 24px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
            }}>
              {/* OAuth */}
              <button type="button" onClick={() => signIn("github", { callbackUrl: "/dashboard" })} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                width: "100%", padding: "10px 16px",
                background: C.bgElevated, color: C.textPrimary,
                border: `1px solid ${C.border}`, borderRadius: 9,
                fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                marginBottom: 16,
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>or continue with email</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
                {error && (
                  <div style={{
                    padding: "10px 14px",
                    background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 8, fontSize: 13, color: C.danger,
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column" as const, gap: 7 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>Full Name</label>
                  <input
                    style={inputStyle(focusedField === "name")}
                    type="text"
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column" as const, gap: 7 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>Email</label>
                  <input
                    style={inputStyle(focusedField === "email")}
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column" as const, gap: 7 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>Password</label>
                  <input
                    style={inputStyle(focusedField === "password")}
                    type="password"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    required
                    minLength={8}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "12px 0",
                    background: C.accent, color: "#ffffff",
                    border: "none", borderRadius: 9,
                    fontSize: 14.5, fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    boxShadow: `0 4px 20px ${C.accentGlow}`,
                    opacity: loading ? 0.7 : 1,
                    marginTop: 4,
                  }}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <p style={{ textAlign: "center" as const, fontSize: 13, color: C.textMuted, marginTop: 20 }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: C.accentLight, textDecoration: "none", fontWeight: 500 }}>Sign in →</Link>
              </p>
            </div>
          </div>
        )}

        {/* Footer links */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 28 }}>
          {[
            { label: "PRIVACY", href: "https://vinexus.space/privacy" },
            { label: "TERMS", href: "https://vinexus.space/terms" },
            { label: "CONTACT", href: "https://vinexus.space/contact" },
          ].map(({ label, href }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.textMuted, display: "inline-block" }} />}
              <a href={href} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: C.textMuted, textDecoration: "none" }}>{label}</a>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
