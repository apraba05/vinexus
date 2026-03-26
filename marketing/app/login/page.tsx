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
  const provider = searchParams.get("provider");
  const next = isDesktop ? "/desktop-callback" : (searchParams.get("next") || "/");
  const desktopParam = isDesktop ? "&desktop=1" : "";

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

  // Auto-redirect to OAuth provider if ?provider= is set
  useEffect(() => {
    if (provider === "github") {
      window.location.href = `/api/auth/oauth/github?desktop=${isDesktop ? "1" : "0"}`;
    } else if (provider === "google") {
      window.location.href = `/api/auth/oauth/google?desktop=${isDesktop ? "1" : "0"}`;
    }
  }, [provider, isDesktop]);

  // Show error from OAuth callback
  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "oauth_denied") setError("Sign-in was cancelled.");
    else if (err === "oauth_failed") setError("OAuth authentication failed. Please try again.");
    else if (err === "no_email") setError("No verified email found on your account.");
    else if (err === "server_error") setError("A server error occurred. Please try again.");
  }, [searchParams]);

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

  // While auto-redirecting on provider param, show a blank loader
  if (provider === "github" || provider === "google") {
    return (
      <div style={{ minHeight: "calc(100vh - 88px)", display: "flex", alignItems: "center", justifyContent: "center", background: D.surface }}>
        <p style={{ color: D.onSurfaceVariant, fontSize: 14 }}>Redirecting to {provider === "github" ? "GitHub" : "Google"}…</p>
      </div>
    );
  }

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

        {/* OAuth buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <a
            href={`/api/auth/oauth/github?desktop=${isDesktop ? "1" : "0"}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              padding: "10px 16px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#24292e",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Continue with GitHub
          </a>

          <a
            href={`/api/auth/oauth/google?desktop=${isDesktop ? "1" : "0"}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              padding: "10px 16px",
              borderRadius: 6,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "#ffffff",
              color: "#3c4043",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: D.outlineVariant }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: D.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.06em" }}>or</span>
          <div style={{ flex: 1, height: 1, background: D.outlineVariant }} />
        </div>

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
