"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import dynamic from "next/dynamic";

const Squares = dynamic(() => import("@/components/reactbits/Squares"), { ssr: false });
const GradientText = dynamic(() => import("@/components/reactbits/GradientText"), { ssr: false });

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
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
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please log in.");
        setLoading(false);
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
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

        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", textAlign: "center", marginBottom: 4 }}>
          Create your account
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", textAlign: "center", marginBottom: 28 }}>
          Start managing your infrastructure
        </p>

        <div style={{ marginBottom: 24 }}>
          <button
            className="oauth-btn"
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            type="button"
            style={{ width: "100%" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div className="divider" style={{ marginBottom: 24 }}>
          <span className="divider-line" />
          <span className="divider-text">or continue with email</span>
          <span className="divider-line" />
        </div>

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
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Full Name</label>
            <input
              className="auth-input"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Password</label>
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
          <button className="btn btn-primary" style={{ width: "100%", padding: "13px 0", marginTop: 4 }} type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-secondary)", marginTop: 24 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
