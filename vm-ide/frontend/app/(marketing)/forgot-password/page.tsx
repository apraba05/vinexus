"use client";
import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const Squares = dynamic(() => import("@/components/reactbits/Squares"), { ssr: false });
const GradientText = dynamic(() => import("@/components/reactbits/GradientText"), { ssr: false });

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setSent(true);
    setLoading(false);
  };

  return (
    <div style={{ position: "relative", minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflow: "hidden" }}>
      <div className="hero-bg" style={{ opacity: 0.4 }}>
        <Squares
          direction="diagonal"
          speed={0.2}
          borderColor="rgba(6, 182, 212, 0.05)"
          squareSize={50}
          hoverFillColor="rgba(6, 182, 212, 0.02)"
        />
      </div>

      <div className="auth-card" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, justifyContent: "center" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <GradientText colors={["#06b6d4", "#22d3ee", "#67e8f9"]} animationSpeed={6}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>InfraNexus</span>
          </GradientText>
        </div>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: "0 auto 20px",
              background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", marginBottom: 8 }}>
              Check your email
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
              If an account exists with that email, we&apos;ve sent a password reset link. Check your inbox and spam folder.
            </p>
            <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", textAlign: "center", marginBottom: 4 }}>
              Forgot your password?
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", textAlign: "center", marginBottom: 28 }}>
              Enter your email and we&apos;ll send you a reset link
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Email</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button className="btn btn-primary" style={{ width: "100%", padding: "13px 0", marginTop: 4 }} type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-secondary)", marginTop: 24 }}>
              Remember your password?{" "}
              <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
