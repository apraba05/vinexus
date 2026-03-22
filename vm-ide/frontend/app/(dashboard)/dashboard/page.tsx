"use client";
import React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { useTheme } from "@/lib/ThemeContext";
import { PLAN_FEATURES, PLAN_LABELS, PLAN_PRICES, type Plan } from "@/lib/plans";

const PLAN_COLORS: Record<Plan, { bg: string; border: string; text: string; dot: string }> = {
  free:       { bg: "rgba(100,140,200,0.06)", border: "rgba(100,140,200,0.2)",  text: "#8fa3c8", dot: "#5a7ab0" },
  premium:    { bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.25)",  text: "#3b82f6", dot: "#3b82f6" },
  max:        { bg: "rgba(0,83,219,0.1)",     border: "rgba(0,83,219,0.3)",     text: "#6394ff", dot: "#3b82f6" },
  "ai-pro":   { bg: "rgba(168,85,247,0.1)",   border: "rgba(168,85,247,0.3)",   text: "#c084fc", dot: "#a855f7" },
  enterprise: { bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.25)", text: "#a78bfa", dot: "#8b5cf6" },
};

const QUICK_ACTIONS = [
  {
    href: "/download",
    label: "Download Vinexus",
    sub: "Get the desktop app",
    iconColor: "#10b981",
    iconBg: "rgba(16,185,129,0.08)",
    iconBorder: "rgba(16,185,129,0.2)",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  },
  {
    href: "/docs",
    label: "Documentation",
    sub: "Guides & API reference",
    iconColor: "#3b82f6",
    iconBg: "rgba(59,130,246,0.08)",
    iconBorder: "rgba(59,130,246,0.2)",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    href: "/docs#claude-integration",
    label: "Claude Integration",
    sub: "Set up AI pair programming",
    iconColor: "#ec4899",
    iconBg: "rgba(236,72,153,0.08)",
    iconBorder: "rgba(236,72,153,0.2)",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4.5 4.5 0 0 0-4.5 4.5c0 1.657.894 3.106 2.227 3.89L9 12l3 2 3-2-.727-1.61A4.5 4.5 0 0 0 12 2z"/></svg>,
  },
  {
    href: "/account",
    label: "Account Settings",
    sub: "Profile & billing",
    iconColor: "#8b5cf6",
    iconBg: "rgba(139,92,246,0.08)",
    iconBorder: "rgba(139,92,246,0.2)",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const { D } = useTheme();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const userPlan: Plan = ((session as any)?.plan as Plan) ?? "free";
  const features = PLAN_FEATURES[userPlan];
  const planColor = PLAN_COLORS[userPlan];
  const isUpgradeable = userPlan === "free" || userPlan === "premium";
  const emailVerified = (session as any)?.emailVerified;

  return (
    <>
      <NavBar />
      <div style={{ background: D.surface, minHeight: "100vh", padding: "48px 24px 80px" }}>
        {/* Background glow */}
        <div aria-hidden style={{
          position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 900, height: 400, pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 0%, ${D.primary}12 0%, transparent 70%)`,
          filter: "blur(60px)",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto" }}>

          {/* Email verification banner */}
          {session && !emailVerified && (
            <div style={{
              padding: "12px 18px", marginBottom: 28,
              background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)",
              borderRadius: 12, display: "flex", alignItems: "center", gap: 10,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span style={{ fontSize: 13, color: "#eab308", flex: 1 }}>Please verify your email address. Check your inbox for a verification link.</span>
              <button
                onClick={async () => { await fetch("/api/auth/resend-verification", { method: "POST" }); alert("Verification email sent!"); }}
                style={{ padding: "5px 14px", background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 8, fontSize: 12, color: "#eab308", cursor: "pointer", fontFamily: "inherit" }}
              >
                Resend
              </button>
            </div>
          )}

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40 }}>
            <div>
              <h1 style={{ fontSize: 30, fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em", margin: "0 0 6px" }}>
                Welcome back, {firstName}
              </h1>
              <p style={{ fontSize: 14, color: D.onSurfaceVariant, margin: 0 }}>Your Vinexus workspace is ready.</p>
            </div>
            {/* Plan badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "6px 16px", borderRadius: 9999,
              background: planColor.bg, border: `1px solid ${planColor.border}`,
              fontSize: 13, fontWeight: 700, color: planColor.text,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: planColor.dot, display: "inline-block" }} />
              {PLAN_LABELS[userPlan]} Plan
            </div>
          </div>

          {/* ── Download CTA ── */}
          <div style={{
            background: D.surfaceContainerLow, border: `1px solid ${D.outlineVariant}`,
            borderRadius: 18, padding: "32px 36px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 48, position: "relative", overflow: "hidden",
          }}>
            <div aria-hidden style={{
              position: "absolute", top: -60, right: -40, width: 400, height: 400,
              background: `radial-gradient(ellipse, ${D.primary}10 0%, transparent 70%)`,
              filter: "blur(60px)", pointerEvents: "none",
            }} />
            <div style={{ flex: 1, position: "relative" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: D.primary, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 10 }}>
                Vinexus Desktop
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em", margin: "0 0 10px", lineHeight: 1.2 }}>
                Connect to any VM.<br />Code like you&apos;re local.
              </h2>
              <p style={{ fontSize: 13.5, color: D.onSurfaceVariant, lineHeight: 1.75, margin: "0 0 22px", maxWidth: 440 }}>
                A full VS Code–grade IDE that SSH-tunnels directly into your cloud VMs. Monaco Editor, integrated terminal, file tree, Git and one-click deploy — your credentials never touch our servers.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
                <a href="#" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", background: D.inverseSurface, color: D.surface,
                  borderRadius: 9999, fontSize: 13, fontWeight: 700, textDecoration: "none",
                }}>
                  <svg width="14" height="14" viewBox="0 0 814 1000" fill="currentColor"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-150.3-93.2C-17.1 770.3-41 568 61.2 419.2c41.6-57.7 108.3-97.4 178.7-99.6 65.7-2 126.4 43 166.8 43 39.5 0 112.4-50.3 189.4-50.3 47.4.8 156.8 15.6 228.4 122.6zm-147.2-122.3c30.7-36.2 51.2-86.7 51.2-137.1 0-7.1-.5-14.3-1.7-20.1-48.6 1.8-106.6 33.3-141.5 75.6-27.5 30.7-52.4 80.6-52.4 131.7 0 7.6 1.3 15.3 1.9 17.8 3 .6 7.8 1.3 12.6 1.3 44.1 0 97.6-29.8 129.9-69.2z"/></svg>
                  macOS
                </a>
                <a href="#" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", background: "transparent", color: D.onSurface,
                  borderRadius: 9999, fontSize: 13, fontWeight: 600, textDecoration: "none",
                  border: `1.5px solid ${D.outlineVariant}`,
                }}>
                  <svg width="12" height="12" viewBox="0 0 88 88" fill="currentColor"><path d="M0 12.4L35.7 7.6l.02 34.43L0 42.1zm35.67 33.47l.03 34.48L.01 75.19V46.08zm4.28-39.2L87.3 0v41.53l-47.35.4zm47.38 41.43L87.3 88 40.0 81.29l-.06-34.5z"/></svg>
                  Windows
                </a>
              </div>
              <p style={{ fontSize: 11, color: D.onSurfaceVariant, marginTop: 10, marginBottom: 0 }}>macOS 12+ · Windows 10+ · ARM & x86_64</p>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.href} href={a.href} style={{ textDecoration: "none" }}>
                <div style={{
                  background: D.surfaceContainerLow, border: `1px solid ${D.outlineVariant}`,
                  borderRadius: 14, padding: "16px 18px",
                  display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                  transition: "border-color 0.15s",
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: a.iconBg, border: `1px solid ${a.iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {a.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: D.inverseSurface, marginBottom: 2 }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: D.onSurfaceVariant }}>{a.sub}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Plan details ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Current plan card */}
            <div style={{ background: D.surfaceContainerLow, border: `1px solid ${D.outlineVariant}`, borderRadius: 16, padding: "24px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: D.inverseSurface, margin: 0 }}>Your Plan</h3>
                <div style={{
                  padding: "4px 14px", borderRadius: 9999,
                  background: planColor.bg, border: `1px solid ${planColor.border}`,
                  fontSize: 12, fontWeight: 700, color: planColor.text,
                }}>
                  {PLAN_LABELS[userPlan]}
                </div>
              </div>

              <div style={{ fontSize: 28, fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em", marginBottom: 4 }}>
                {PLAN_PRICES[userPlan]}<span style={{ fontSize: 14, fontWeight: 400, color: D.onSurfaceVariant }}>{userPlan !== "enterprise" ? "/month" : ""}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 0", marginTop: 20, marginBottom: 20 }}>
                {[
                  { label: "VM connections", value: features.maxVmConnections === -1 ? "Unlimited" : String(features.maxVmConnections) },
                  { label: "AI enabled", value: features.aiEnabled ? "Yes" : "No" },
                  { label: "AI requests/day", value: features.aiRequestsPerDay === -1 ? "Unlimited" : String(features.aiRequestsPerDay) },
                  { label: "Deploy automation", on: features.deployAutomation },
                  { label: "Priority support", on: features.prioritySupport },
                ].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                    {"on" in f ? (
                      f.on
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.outlineVariant} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                    <span style={{ fontSize: 12.5, color: D.onSurface }}>{f.label}{"value" in f ? <strong style={{ color: D.inverseSurface, marginLeft: 4 }}>{f.value}</strong> : ""}</span>
                  </div>
                ))}
              </div>

              {isUpgradeable && (
                <Link href="/pricing" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px 0", borderRadius: 9999,
                  background: D.primary, color: "#fff",
                  fontSize: 13.5, fontWeight: 700, textDecoration: "none",
                  boxShadow: `0 4px 16px ${D.primary}40`,
                }}>
                  Upgrade Plan
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              )}
            </div>

            {/* Claude / AI feature promo */}
            <div style={{
              background: D.surfaceContainerLow, border: `1px solid ${D.outlineVariant}`,
              borderRadius: 16, padding: "24px 28px",
              position: "relative" as const, overflow: "hidden",
            }}>
              <div aria-hidden style={{
                position: "absolute", top: -30, right: -30, width: 200, height: 200,
                background: "radial-gradient(ellipse, rgba(236,72,153,0.08) 0%, transparent 70%)",
                filter: "blur(30px)", pointerEvents: "none",
              }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#ec4899", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 12 }}>
                  Claude Code Integration
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: D.inverseSurface, letterSpacing: "-0.02em", margin: "0 0 12px", lineHeight: 1.3 }}>
                  AI pair programming<br />on your VM
                </h3>
                <p style={{ fontSize: 13, color: D.onSurfaceVariant, lineHeight: 1.7, margin: "0 0 20px" }}>
                  Install Claude Code on your VM and run it directly from the Vinexus terminal. Full codebase access, file editing, and command execution.
                </p>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: D.success, marginBottom: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Available on all plans
                  </div>
                  <p style={{ fontSize: 12, color: D.onSurfaceVariant, margin: "0 0 16px", lineHeight: 1.6 }}>
                    Claude Code runs on your VM using your own Anthropic API key — no plan restrictions apply.
                  </p>
                  <Link href="/docs#claude-integration" style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 20px", borderRadius: 9999,
                    background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.25)",
                    color: "#ec4899", fontSize: 13, fontWeight: 600, textDecoration: "none",
                  }}>
                    Setup Guide
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
