"use client";
import React, { useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
}

interface Props {
  onLogin: (user: User) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ea = typeof window !== "undefined" ? (window as any).electronAPI : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let result;
      if (mode === "login") {
        result = await ea?.auth.login({ email, password });
      } else {
        result = await ea?.auth.register({ email, name, password });
      }
      if (result?.error) {
        setError(result.error);
      } else if (result?.user) {
        onLogin(result.user);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <img src="/vinexus-wordmark.png" alt="VINEXUS" style={styles.wordmark} />
        </div>

        <h1 style={styles.heading}>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p style={styles.sub}>{mode === "login" ? "Sign in to your Vinexus account" : "Set up your Vinexus account to get started"}</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === "register" && (
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus={mode === "login"}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrap}>
              <input
                style={{ ...styles.input, paddingRight: 40 }}
                type={showPassword ? "text" : "password"}
                placeholder={mode === "login" ? "Your password" : "At least 6 characters"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div style={styles.switchRow}>
          {mode === "login" ? (
            <>
              <span style={styles.switchText}>Don&apos;t have an account?</span>
              <button style={styles.switchBtn} onClick={() => { setMode("register"); setError(""); }}>
                Create one
              </button>
            </>
          ) : (
            <>
              <span style={styles.switchText}>Already have an account?</span>
              <button style={styles.switchBtn} onClick={() => { setMode("login"); setError(""); }}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, any> = {
  root: {
    position: "fixed" as const,
    inset: 0,
    background: "var(--bg-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    WebkitAppRegion: "drag" as any,
  },
  card: {
    width: 400,
    maxWidth: "calc(100vw - 48px)",
    padding: "40px 40px 32px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    boxShadow: "0 20px 60px rgba(7,14,29,0.12)",
    WebkitAppRegion: "no-drag" as any,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 28,
  },
  wordmark: {
    height: 32,
    width: "auto",
    objectFit: "contain" as const,
    mixBlendMode: "multiply" as const,
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--text-bright)",
    letterSpacing: "-0.025em",
    margin: "0 0 6px",
    fontFamily: "var(--font-sans)",
  },
  sub: {
    fontSize: 13,
    color: "var(--text-secondary)",
    margin: "0 0 28px",
    fontFamily: "var(--font-sans)",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-secondary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    fontFamily: "var(--font-sans)",
  },
  input: {
    padding: "10px 12px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 13,
    color: "var(--text-primary)",
    outline: "none",
    fontFamily: "var(--font-sans)",
    width: "100%",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  },
  passwordWrap: {
    position: "relative" as const,
  },
  eyeBtn: {
    position: "absolute" as const,
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    padding: 2,
  },
  error: {
    padding: "8px 12px",
    background: "rgba(185,28,28,0.07)",
    border: "1px solid rgba(185,28,28,0.2)",
    borderRadius: 7,
    fontSize: 12,
    color: "var(--danger)",
    fontFamily: "var(--font-sans)",
  },
  submitBtn: {
    padding: "11px 0",
    background: "var(--accent)",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    marginTop: 4,
    transition: "opacity 0.15s",
  },
  switchRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 22,
  },
  switchText: {
    fontSize: 12,
    color: "var(--text-muted)",
    fontFamily: "var(--font-sans)",
  },
  switchBtn: {
    background: "none",
    border: "none",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--accent)",
    cursor: "pointer",
    padding: 0,
    fontFamily: "var(--font-sans)",
  },
};
