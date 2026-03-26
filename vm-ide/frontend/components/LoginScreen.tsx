"use client";
import React, { useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import { useTheme } from "@/lib/ThemeContext";

interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
}

interface Props {
  onLogin: (user: User) => void;
}

const WEB_AUTH_ORIGIN = process.env.NEXT_PUBLIC_DESKTOP_AUTH_ORIGIN || "https://vinexus.space";

export default function LoginScreen({ onLogin }: Props) {
  const { isDark, toggle } = useTheme();
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState("");

  const ea = typeof window !== "undefined" ? (window as any).electronAPI : null;

  const handleOAuth = async (provider: "google" | "github") => {
    setError("");
    if (!ea?.app?.openExternal) {
      setError("Desktop browser bridge is unavailable. Please restart Vinexus.");
      return;
    }
    setOauthLoading(provider);
    try {
      const url = `${WEB_AUTH_ORIGIN}/login?desktop=1&provider=${provider}`;
      const result = await ea.app.openExternal(url);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || "Failed to open the browser for sign-in.");
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div style={styles.root}>
      <button
        type="button"
        style={styles.themeToggle}
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? "Light mode" : "Dark mode"}
      </button>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <BrandLogo iconSize={30} textSize={28} textColor="var(--text-bright, #f0f6fc)" />
        </div>

        <h1 style={styles.heading}>Welcome to Vinexus</h1>
        <p style={styles.sub}>Sign in to continue to your IDE</p>

        <div style={styles.oauthGroup}>
          <button
            type="button"
            style={{
              ...styles.githubBtn,
              ...(oauthLoading ? styles.btnDisabled : null),
            }}
            onClick={() => handleOAuth("github")}
            disabled={!!oauthLoading}
          >
            {oauthLoading === "github" ? (
              <span style={styles.spinner} />
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            )}
            {oauthLoading === "github" ? "Opening browser…" : "Continue with GitHub"}
          </button>

          <button
            type="button"
            style={{
              ...styles.googleBtn,
              ...(oauthLoading ? styles.btnDisabled : null),
            }}
            onClick={() => handleOAuth("google")}
            disabled={!!oauthLoading}
          >
            {oauthLoading === "google" ? (
              <span style={{ ...styles.spinner, borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#555" }} />
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {oauthLoading === "google" ? "Opening browser…" : "Continue with Google"}
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <p style={styles.hint}>
          Your browser will open to complete sign-in securely.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, any> = {
  root: {
    position: "fixed" as const,
    inset: 0,
    background: "var(--bg-primary, #0d1117)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  themeToggle: {
    position: "absolute" as const,
    top: 20,
    right: 20,
    padding: "9px 12px",
    background: "var(--bg-elevated, #13191f)",
    color: "var(--text-primary, #c9d1d9)",
    border: "1px solid var(--border, rgba(48,54,61,0.8))",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    WebkitAppRegion: "no-drag" as any,
  },
  card: {
    width: 380,
    maxWidth: "calc(100vw - 48px)",
    padding: "40px 40px 32px",
    background: "var(--bg-elevated, #13191f)",
    border: "1px solid var(--border, rgba(48,54,61,0.8))",
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
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--text-bright, #f0f6fc)",
    letterSpacing: "-0.025em",
    margin: "0 0 6px",
    fontFamily: "var(--font-sans)",
  },
  sub: {
    fontSize: 13,
    color: "var(--text-secondary, #8b949e)",
    margin: "0 0 28px",
    fontFamily: "var(--font-sans)",
  },
  oauthGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    marginBottom: 16,
  },
  githubBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    padding: "12px 14px",
    background: "#24292e",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    transition: "opacity 0.15s",
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    padding: "12px 14px",
    background: "#ffffff",
    color: "#3c4043",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    transition: "opacity 0.15s",
  },
  btnDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  spinner: {
    display: "inline-block",
    width: 13,
    height: 13,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  error: {
    padding: "8px 12px",
    background: "rgba(185,28,28,0.07)",
    border: "1px solid rgba(185,28,28,0.2)",
    borderRadius: 7,
    fontSize: 12,
    color: "var(--danger, #f85149)",
    fontFamily: "var(--font-sans)",
    marginBottom: 12,
  },
  hint: {
    fontSize: 11,
    color: "var(--text-muted, #484f58)",
    textAlign: "center" as const,
    margin: "8px 0 0",
    fontFamily: "var(--font-sans)",
  },
};
