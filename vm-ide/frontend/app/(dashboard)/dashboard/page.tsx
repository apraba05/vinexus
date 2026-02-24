"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { usePlan } from "@/contexts/PlanContext";
import Link from "next/link";

const featureList = [
  { name: "Monaco Editor", key: "ide" },
  { name: "Integrated Terminal", key: "terminal" },
  { name: "File Management", key: "files" },
  { name: "One-Click Deploy", key: "deploy" },
  { name: "Server Commands", key: "commands" },
  { name: "AI Insights", key: "ai" },
] as const;

export default function DashboardPage() {
  const { data: session } = useSession();
  const { plan, features, isPro } = usePlan();
  const emailVerified = (session as any)?.emailVerified;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "40px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Email verification warning */}
        {session && !emailVerified && (
          <div style={{
            padding: "14px 20px",
            background: "rgba(234, 179, 8, 0.06)",
            border: "1px solid rgba(234, 179, 8, 0.15)",
            borderRadius: "var(--radius-md)",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span style={{ fontSize: 13, color: "#eab308", flex: 1 }}>
              Please verify your email address. Check your inbox for a verification link.
            </span>
            <button
              className="btn btn-sm"
              style={{ background: "rgba(234, 179, 8, 0.1)", color: "#eab308", border: "1px solid rgba(234, 179, 8, 0.2)" }}
              onClick={async () => {
                await fetch("/api/auth/resend-verification", { method: "POST" });
                alert("Verification email sent!");
              }}
            >
              Resend
            </button>
          </div>
        )}

        {/* Welcome card */}
        <div className="surface" style={{ padding: 32, marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-bright)", marginBottom: 4 }}>
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
            Here&apos;s your InfraNexus overview
          </p>
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          <Link href="/app" style={{ textDecoration: "none" }}>
            <div className="card card-glow" style={{ padding: 24, textAlign: "center", cursor: "pointer" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, margin: "0 auto 14px",
                background: "rgba(6, 182, 212, 0.08)", border: "1px solid rgba(6, 182, 212, 0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-bright)" }}>Open IDE</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Edit files & terminal</div>
            </div>
          </Link>

          <Link href="/account" style={{ textDecoration: "none" }}>
            <div className="card card-glow" style={{ padding: 24, textAlign: "center", cursor: "pointer" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, margin: "0 auto 14px",
                background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-bright)" }}>Account</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Settings & billing</div>
            </div>
          </Link>

          <Link href="/docs" style={{ textDecoration: "none" }}>
            <div className="card card-glow" style={{ padding: 24, textAlign: "center", cursor: "pointer" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, margin: "0 auto 14px",
                background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-bright)" }}>Documentation</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Guides & API docs</div>
            </div>
          </Link>

          {!isPro && (
            <Link href="/pricing" style={{ textDecoration: "none" }}>
              <div className="card card-glow" style={{ padding: 24, textAlign: "center", cursor: "pointer", borderColor: "rgba(6, 182, 212, 0.15)" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, margin: "0 auto 14px",
                  background: "rgba(6, 182, 212, 0.08)", border: "1px solid rgba(6, 182, 212, 0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--accent)" }}>Upgrade to Pro</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Unlock all features</div>
              </div>
            </Link>
          )}
        </div>

        {/* Subscription status */}
        <div className="surface" style={{ padding: 28, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-bright)", margin: 0 }}>
              Your Plan
            </h2>
            <span className={isPro ? "badge badge-accent" : "badge badge-neutral"}>
              {plan === "pro" ? "Pro" : "Free"}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {featureList.map((f) => {
              const enabled = features[f.key];
              return (
                <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                  {enabled ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  )}
                  <span style={{ fontSize: 13, color: enabled ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {f.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upgrade CTA for free users */}
        {!isPro && (
          <div style={{
            padding: 32,
            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.06) 0%, rgba(139, 92, 246, 0.04) 100%)",
            border: "1px solid rgba(6, 182, 212, 0.12)",
            borderRadius: "var(--radius-lg)",
            textAlign: "center",
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-bright)", marginBottom: 8 }}>
              Unlock the full power of InfraNexus
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
              Get deploy, server commands, and AI-powered insights with the Pro plan.
            </p>
            <Link href="/pricing" className="btn btn-primary btn-md" style={{ textDecoration: "none" }}>
              Upgrade to Pro &mdash; $10/mo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
