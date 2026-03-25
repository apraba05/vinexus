"use client";
import React, { Suspense, useEffect, useState } from "react";
import { getProviders, getSession, signIn, useSession } from "next-auth/react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { useTheme } from "@/lib/ThemeContext";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div style={{ background: "#070e1d", minHeight: "100vh" }} />}>
      <LoginPage />
    </Suspense>
  );
}

function LoginPage() {
  const { D, isDark } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [desktopOauthStarted, setDesktopOauthStarted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    getProviders()
      .then((providers) => setOauthProviders(providers ?? {}))
      .catch(() => setOauthProviders({}));
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  const hasGoogle = !!oauthProviders?.google;
  const hasGitHub = !!oauthProviders?.github;
  const isDesktopFlow = searchParams.get("desktop") === "1";
  const desktopProvider = searchParams.get("provider");

  useEffect(() => {
    if (!isDesktopFlow || desktopOauthStarted) return;
    if (!oauthProviders) return;
    if (desktopProvider !== "google" && desktopProvider !== "github") return;

    const isAvailable =
      (desktopProvider === "google" && hasGoogle) ||
      (desktopProvider === "github" && hasGitHub);

    if (!isAvailable) {
      setError(`${desktopProvider === "google" ? "Google" : "GitHub"} sign-in is not configured right now.`);
      return;
    }

    setDesktopOauthStarted(true);
    signIn(desktopProvider, { callbackUrl: "/desktop-callback" });
  }, [desktopOauthStarted, desktopProvider, hasGitHub, hasGoogle, isDesktopFlow, oauthProviders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      await getSession();
      router.replace(result?.url ?? "/dashboard");
      router.refresh();
    }
  };

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "11px 14px",
    background: D.surfaceContainerHigh,
    color: D.inverseSurface,
    border: `1px solid ${focused ? D.primary : D.outlineVariant}`,
    borderRadius: 9,
    fontSize: 14,
    outline: "none",
    boxShadow: focused ? `0 0 0 3px ${D.primary}22` : "none",
    transition: "all 0.15s",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
  });

  return (
    <div style={{
      minHeight: "calc(100vh - 44px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 24px",
      background: D.surface,
    }}>
      {/* Background glow */}
      <div aria-hidden style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 600, height: 400,
        background: `radial-gradient(ellipse at 50% 0%, ${D.primary}18 0%, transparent 70%)`,
        filter: "blur(60px)", pointerEvents: "none",
      }} />

      <div style={{
        display: "flex", flexDirection: "column" as const,
        alignItems: "center", width: "100%", maxWidth: 400,
        position: "relative" as const, zIndex: 1,
      }}>

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", marginBottom: 10 }}>
          <BrandLogo
            iconSize={28}
            textSize={26}
            textColor={isDark ? D.inverseSurface : D.onSurface}
            muted
          />
        </Link>
        <p style={{ fontSize: 14, color: D.onSurfaceVariant, marginBottom: 36 }}>Sign in to your account</p>
        {isDesktopFlow && (
          <p style={{ fontSize: 12.5, color: D.onSurfaceVariant, margin: "0 0 20px", textAlign: "center" as const }}>
            Completing desktop sign-in through your browser.
          </p>
        )}

        {/* Card */}
        <div style={{
          width: "100%",
          background: D.surfaceContainerLow,
          border: `1px solid ${D.outlineVariant}`,
          borderRadius: 16,
          padding: "28px 28px 24px",
          boxShadow: isDark ? "0 8px 40px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.08)",
        }}>

          {/* OAuth buttons */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 20 }}>
            <button type="button" onClick={() => hasGoogle && signIn("google", { callbackUrl: isDesktopFlow ? "/desktop-callback" : "/dashboard" })} disabled={!hasGoogle} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
              width: "100%", padding: "10px 16px",
              background: D.surfaceContainerHigh, color: D.onSurface,
              border: `1px solid ${D.outlineVariant}`, borderRadius: 9,
              fontSize: 13.5, fontWeight: 500, cursor: hasGoogle ? "pointer" : "not-allowed", fontFamily: "inherit",
              opacity: hasGoogle ? 1 : 0.55,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {hasGoogle ? "Continue with Google" : "Google sign-in unavailable"}
            </button>
            <button type="button" onClick={() => hasGitHub && signIn("github", { callbackUrl: isDesktopFlow ? "/desktop-callback" : "/dashboard" })} disabled={!hasGitHub} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
              width: "100%", padding: "10px 16px",
              background: D.surfaceContainerHigh, color: D.onSurface,
              border: `1px solid ${D.outlineVariant}`, borderRadius: 9,
              fontSize: 13.5, fontWeight: 500, cursor: hasGitHub ? "pointer" : "not-allowed", fontFamily: "inherit",
              opacity: hasGitHub ? 1 : 0.55,
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              {hasGitHub ? "Continue with GitHub" : "GitHub sign-in unavailable"}
            </button>
          </div>
          {oauthProviders && !hasGoogle && !hasGitHub && (
            <div style={{
              marginBottom: 16,
              padding: "10px 14px",
              background: isDark ? "rgba(245,158,11,0.10)" : "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.22)",
              borderRadius: 8,
              fontSize: 12.5,
              color: D.onSurfaceVariant,
            }}>
              OAuth sign-in is not configured in this environment yet. Use email/password until Google and GitHub credentials are set.
            </div>
          )}

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: D.outlineVariant }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: D.onSurfaceVariant, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>or</span>
            <div style={{ flex: 1, height: 1, background: D.outlineVariant }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            {error && (
              <div style={{
                padding: "10px 14px",
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 8, fontSize: 13, color: "#ef4444",
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column" as const, gap: 7 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: D.onSurface }}>Email</label>
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
              <label style={{ fontSize: 13, fontWeight: 500, color: D.onSurface }}>Password</label>
              <div style={{ position: "relative" as const }}>
                <input
                  style={{ ...inputStyle(focusedField === "password"), paddingRight: 40 }}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 2,
                    color: D.onSurfaceVariant, display: "flex", alignItems: "center",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 0",
                background: D.primary, color: "#ffffff",
                border: "none", borderRadius: 9,
                fontSize: 14.5, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                boxShadow: `0 4px 20px ${D.primary}40`,
                opacity: loading ? 0.7 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginTop: 4,
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    display: "inline-block", width: 13, height: 13,
                    border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                    borderRadius: "50%", animation: "spin 0.7s linear infinite",
                  }} />
                  Signing in...
                </>
              ) : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center" as const, fontSize: 13, color: D.onSurfaceVariant, marginTop: 20 }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: D.primary, textDecoration: "none", fontWeight: 500 }}>Create one →</Link>
          </p>
          <p style={{ textAlign: "center" as const, marginTop: 8 }}>
            <Link href="/forgot-password" style={{ fontSize: 12, color: D.onSurfaceVariant, textDecoration: "none" }}>Forgot password?</Link>
          </p>
        </div>

        {/* Footer links */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24 }}>
          {[
            { label: "PRIVACY", href: "https://vinexus.space/privacy" },
            { label: "TERMS", href: "https://vinexus.space/terms" },
            { label: "CONTACT", href: "https://vinexus.space/contact" },
          ].map(({ label, href }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <span style={{ width: 3, height: 3, borderRadius: "50%", background: D.onSurfaceVariant, display: "inline-block" }} />}
              <a href={href} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: D.onSurfaceVariant, textDecoration: "none" }}>{label}</a>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
