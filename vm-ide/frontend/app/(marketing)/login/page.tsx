"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  const fillTest = () => {
    setEmail("apraba05@gmail.com");
    setPassword("AshanTest123");
    setError("");
  };

  return (
    <div style={s.page}>
      {/* Background dots */}
      <div style={s.dots} aria-hidden>
        {DOTS.map((d, i) => (
          <span key={i} style={{ position: "absolute", left: d.left, top: d.top, width: d.size, height: d.size, borderRadius: "50%", background: d.color, opacity: d.opacity }} />
        ))}
      </div>

      {/* Radial glow centred on card */}
      <div style={s.glow} aria-hidden />

      <div style={s.layout}>
        {/* Left column — branding */}
        <div style={s.brand}>
          <div style={s.brandLogoRow}>
            <div style={s.brandMark}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3fffa2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span style={s.brandName}>Vela</span>
          </div>

          <h2 style={s.brandHeadline}>
            Your servers,<br />
            your browser,<br />
            your control.
          </h2>

          <p style={s.brandSub}>
            A full VS Code experience for managing Linux VMs — no desktop app required.
          </p>

          {/* Mini feature list */}
          <div style={s.brandFeatures}>
            {[
              { icon: "⌨", label: "Monaco Editor" },
              { icon: "⚡", label: "SSH Terminal" },
              { icon: "🚀", label: "One-Click Deploy" },
            ].map((f) => (
              <div key={f.label} style={s.brandFeatureRow}>
                <span style={s.brandFeatureIcon}>{f.icon}</span>
                <span style={s.brandFeatureLabel}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — form card */}
        <div style={s.card}>
          <h1 style={s.heading}>Welcome back</h1>
          <p style={s.subheading}>Sign in to continue to Vela</p>

          {/* Test account banner */}
          <button type="button" onClick={fillTest} style={s.testBanner}>
            <div style={s.testBannerLeft}>
              <span style={s.testDot} />
              <div>
                <div style={s.testBannerTitle}>Test account available</div>
                <div style={s.testBannerSub}>Click to fill in demo credentials</div>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3fffa2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>

          <form onSubmit={handleSubmit} style={s.form}>
            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.field}>
              <label style={s.label}>Email address</label>
              <input
                style={{
                  ...s.input,
                  ...(focusedField === "email" ? s.inputFocused : {}),
                }}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>

            <div style={s.field}>
              <div style={s.passwordHeader}>
                <label style={s.label}>Password</label>
                <Link href="/forgot-password" style={s.forgotLink}>Forgot password?</Link>
              </div>
              <input
                style={{
                  ...s.input,
                  ...(focusedField === "password" ? s.inputFocused : {}),
                }}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>

            <button
              style={{ ...s.submitBtn, ...(loading ? { opacity: 0.65, cursor: "not-allowed" } : {}) }}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                  <span style={s.spinner} />
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p style={s.footer}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={s.signupLink}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const DOTS = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 23 + 7) % 96}%`,
  top: `${(i * 31 + 9) % 90}%`,
  size: i % 4 === 0 ? 3 : 2,
  opacity: 0.1 + (i % 4) * 0.05,
  color: ["#3fffa2", "#4f8ef7", "#a78bfa", "#fca98d"][i % 4],
}));

const s: Record<string, React.CSSProperties> = {
  page: {
    position: "relative",
    minHeight: "calc(100vh - 64px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    background: "#0b1120",
    overflow: "hidden",
  },
  dots: { position: "absolute", inset: 0, pointerEvents: "none" },
  glow: {
    position: "absolute",
    top: "20%",
    right: "25%",
    width: 480,
    height: 320,
    background: "radial-gradient(ellipse, rgba(63,255,162,0.05) 0%, rgba(79,142,247,0.06) 50%, transparent 70%)",
    filter: "blur(50px)",
    pointerEvents: "none",
  },

  // Two-column layout
  layout: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    gap: 80,
    alignItems: "center",
    width: "100%",
    maxWidth: 900,
  },

  // Brand column
  brand: {
    flex: "0 0 340px",
  },
  brandLogoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 40,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 11,
    background: "rgba(63,255,162,0.07)",
    border: "1px solid rgba(63,255,162,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 17,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.02em",
  },
  brandHeadline: {
    fontSize: "clamp(28px, 3.5vw, 40px)",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.04em",
    lineHeight: 1.15,
    margin: "0 0 16px",
  },
  brandSub: {
    fontSize: 14,
    color: "#4a6490",
    lineHeight: 1.7,
    marginBottom: 32,
  },
  brandFeatures: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  brandFeatureRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  brandFeatureIcon: {
    fontSize: 14,
    width: 28,
    height: 28,
    borderRadius: 7,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  brandFeatureLabel: {
    fontSize: 13,
    color: "#8fa3c8",
    fontWeight: 500,
  },

  // Form card
  card: {
    flex: 1,
    background: "#0f1829",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: "36px 32px",
    boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
  },
  heading: {
    fontSize: 24,
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.03em",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: "#4a6490",
    marginBottom: 24,
  },

  // Test banner
  testBanner: {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(63,255,162,0.04)",
    border: "1px solid rgba(63,255,162,0.14)",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    marginBottom: 24,
    fontFamily: "var(--font-sans)",
    transition: "all 0.15s",
  },
  testBannerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  testDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#3fffa2",
    display: "inline-block",
    boxShadow: "0 0 7px rgba(63,255,162,0.8)",
    flexShrink: 0,
  },
  testBannerTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#3fffa2",
    textAlign: "left" as const,
  },
  testBannerSub: {
    fontSize: 11,
    color: "rgba(63,255,162,0.5)",
    textAlign: "left" as const,
  },

  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 18,
  },
  errorBox: {
    padding: "11px 14px",
    background: "rgba(239,68,68,0.06)",
    border: "1px solid rgba(239,68,68,0.15)",
    borderRadius: 10,
    fontSize: 13,
    color: "#ef4444",
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: "#8fa3c8",
  },
  input: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 14,
    color: "#ffffff",
    outline: "none",
    fontFamily: "var(--font-sans)",
    width: "100%",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  },
  inputFocused: {
    borderColor: "rgba(63,255,162,0.35)",
    background: "rgba(63,255,162,0.02)",
  },
  passwordHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
    fontSize: 12,
    color: "#4a6490",
    textDecoration: "none",
    fontWeight: 500,
    transition: "color 0.15s",
  },
  submitBtn: {
    padding: "13px 0",
    background: "#3fffa2",
    color: "#0b1120",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    fontFamily: "var(--font-sans)",
    boxShadow: "0 4px 20px rgba(63,255,162,0.2)",
    transition: "all 0.15s",
    marginTop: 4,
  },
  spinner: {
    display: "inline-block",
    width: 14,
    height: 14,
    border: "2px solid rgba(11,17,32,0.3)",
    borderTopColor: "#0b1120",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  footer: {
    textAlign: "center" as const,
    fontSize: 13,
    color: "#4a6490",
    marginTop: 24,
  },
  signupLink: {
    color: "#3fffa2",
    textDecoration: "none",
    fontWeight: 600,
  },
};
