"use client";
import React, { useState } from "react";
import Link from "next/link";

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
    <div style={{
      minHeight: "calc(100vh - 44px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#ffffff",
      padding: "40px 20px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {sent ? (
          /* ── Success state ── */
          <div>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 24,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>

            <h1 style={{
              fontSize: 32, fontWeight: 800, color: "#0d0d0d",
              letterSpacing: "-0.02em", margin: "0 0 10px",
            }}>
              Check your email
            </h1>
            <p style={{ fontSize: 15, color: "#6b6b6b", lineHeight: 1.65, margin: "0 0 32px" }}>
              If an account exists for <strong style={{ color: "#0d0d0d" }}>{email}</strong>, you'll receive a password reset link shortly. Check your inbox and spam folder.
            </p>

            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 22px", borderRadius: 9999,
              background: "#0d0d0d", color: "#ffffff",
              fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>
              Back to sign in
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <h1 style={{
              fontSize: 36, fontWeight: 800, color: "#0d0d0d",
              letterSpacing: "-0.02em", margin: "0 0 10px",
            }}>
              Reset your password
            </h1>
            <p style={{ fontSize: 15, color: "#6b6b6b", margin: "0 0 36px", lineHeight: 1.6 }}>
              Enter your email and we&apos;ll send you a link to get back into your account.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <label style={{
                fontSize: 13, fontWeight: 600, color: "#0d0d0d",
                display: "block", marginBottom: 8,
              }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "12px 16px", fontSize: 15,
                  border: "1.5px solid #e8e8ea", borderRadius: 10,
                  background: "#ffffff", color: "#0d0d0d",
                  outline: "none", fontFamily: "inherit",
                  marginBottom: 20,
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#0d0d0d"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e8e8ea"; }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "13px 24px",
                  background: "#0d0d0d", color: "#ffffff",
                  border: "none", borderRadius: 9999,
                  fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", letterSpacing: "-0.01em",
                  opacity: loading ? 0.65 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p style={{ fontSize: 14, color: "#6b6b6b", marginTop: 28, lineHeight: 1.6 }}>
              Remember your password?{" "}
              <Link href="/login" style={{ color: "#0d0d0d", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 2 }}>
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
