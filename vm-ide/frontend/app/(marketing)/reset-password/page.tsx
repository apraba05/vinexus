"use client";
import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const Squares = dynamic(() => import("@/components/reactbits/Squares"), { ssr: false });
const GradientText = dynamic(() => import("@/components/reactbits/GradientText"), { ssr: false });

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ position: "relative", minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div className="auth-card" style={{ textAlign: "center", maxWidth: 420, width: "100%" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", marginBottom: 8 }}>
            Invalid Reset Link
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
            This password reset link is invalid or has expired.
          </p>
          <Link href="/forgot-password" className="btn btn-primary btn-md" style={{ textDecoration: "none" }}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

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

        {success ? (
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
              Password reset!
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Redirecting you to sign in...
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", textAlign: "center", marginBottom: 4 }}>
              Set new password
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", textAlign: "center", marginBottom: 28 }}>
              Enter your new password below
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {error && (
                <div style={{
                  padding: "10px 14px",
                  background: "rgba(239, 68, 68, 0.06)",
                  color: "var(--danger)",
                  border: "1px solid rgba(239, 68, 68, 0.12)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                }}>
                  {error}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>New Password</label>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Confirm Password</label>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <button className="btn btn-primary" style={{ width: "100%", padding: "13px 0", marginTop: 4 }} type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
