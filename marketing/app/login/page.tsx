"use client";
import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";

function LoginContent() {
  const { D } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = searchParams.get("desktop") === "1";
  const next = isDesktop ? "/desktop-callback" : (searchParams.get("next") || "/");

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup fields
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      const data = await r.json();
      if (data.user) router.replace(next);
    });
  }, [next, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 6,
    border: `1px solid ${D.outlineVariant}`,
    background: D.surfaceContainerLow,
    color: D.onSurface,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: D.onSurfaceVariant,
    marginBottom: 5,
    display: "block",
  };

  const btnPrimary: React.CSSProperties = {
    width: "100%",
    padding: "10px 16px",
    borderRadius: 6,
    border: "none",
    background: D.primary,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.7 : 1,
    fontFamily: "inherit",
    transition: "opacity 0.15s",
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 88px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      background: D.surface,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: D.surfaceContainerLow,
        border: `1px solid ${D.outlineVariant}`,
        borderRadius: 12,
        padding: "36px 32px",
      }}>
        {/* Logo / back link */}
        <div style={{ marginBottom: 20, textAlign: "center" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <Image src="/favicon.png" alt="Vinexus" width={24} height={24} unoptimized style={{ width: 24, height: 24, borderRadius: 6, display: "block" }} />
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.04em", color: D.inverseSurface }}>
              Vinexus
            </span>
          </Link>
        </div>
        {isDesktop && (
          <div style={{
            marginBottom: 20,
            padding: "10px 14px",
            borderRadius: 8,
            background: D.primaryContainer,
            border: `1px solid ${D.primary}22`,
            fontSize: 13,
            color: D.onSurface,
            textAlign: "center",
            lineHeight: 1.5,
          }}>
            Sign in to continue to the <strong>Vinexus desktop app</strong>.
            You'll be returned automatically after login.
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: "flex",
          borderRadius: 6,
          background: D.surfaceContainerHigh,
          padding: 3,
          gap: 2,
          marginBottom: 28,
        }}>
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 4,
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: tab === t ? D.primary : "transparent",
                color: tab === t ? "#fff" : D.onSurfaceVariant,
                fontFamily: "inherit",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {t === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 18,
            padding: "10px 14px",
            borderRadius: 6,
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#dc2626",
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Login form */}
        {tab === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>
            <button type="submit" disabled={loading} style={btnPrimary}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        )}

        {/* Signup form */}
        {tab === "signup" && (
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                required
                autoComplete="name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Min. 6 characters"
                style={inputStyle}
              />
            </div>
            <button type="submit" disabled={loading} style={btnPrimary}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}

        <p style={{ marginTop: 20, fontSize: 12, color: D.onSurfaceVariant, textAlign: "center" }}>
          <Link href="/" style={{ color: D.onSurfaceVariant, textDecoration: "underline" }}>
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
