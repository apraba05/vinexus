"use client";
import React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { useTheme } from "@/lib/ThemeContext";
import { PLAN_FEATURES, PLAN_LABELS, PLAN_PRICES, type Plan } from "@/lib/plans";

const MAC_URL = "https://github.com/apraba05/vinexus/releases/latest/download/Vinexus-mac.dmg";
const WIN_URL = "https://github.com/apraba05/vinexus/releases/latest/download/Vinexus-Setup.exe";

const PLAN_COLORS: Record<Plan, { text: string; dot: string }> = {
  free:       { text: "#8fa3c8", dot: "#5a7ab0" },
  premium:    { text: "#3b82f6", dot: "#3b82f6" },
  max:        { text: "#6394ff", dot: "#3b82f6" },
  "ai-pro":   { text: "#c084fc", dot: "#a855f7" },
  enterprise: { text: "#a78bfa", dot: "#8b5cf6" },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { D } = useTheme();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const userPlan: Plan = ((session as any)?.plan as Plan) ?? "free";
  const features = PLAN_FEATURES[userPlan];
  const planColor = PLAN_COLORS[userPlan];
  const isUpgradeable = userPlan === "free" || userPlan === "premium";
  const emailVerified = (session as any)?.emailVerified;

  const divider = (
    <div style={{ height: 1, background: D.outlineVariant, opacity: 0.5, margin: "32px 0" }} />
  );

  return (
    <>
      <NavBar />
      <div style={{ background: D.surface, minHeight: "100vh", padding: "48px 0 100px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 32px" }}>

          {/* Email verification banner */}
          {session && !emailVerified && (
            <div style={{
              padding: "10px 16px", marginBottom: 36,
              background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.15)",
              borderRadius: 8, display: "flex", alignItems: "center", gap: 10,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span style={{ fontSize: 13, color: "#ca8a04", flex: 1 }}>Please verify your email address. Check your inbox for a verification link.</span>
              <button
                onClick={async () => {
                  const res = await fetch("/api/auth/resend-verification", { method: "POST" });
                  alert(res.ok ? "Verification email sent! Check your inbox." : "Failed to send — please try again.");
                }}
                style={{ padding: "3px 10px", background: "transparent", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 4, fontSize: 12, color: "#ca8a04", cursor: "pointer", fontFamily: "inherit" }}
              >
                Resend
              </button>
            </div>
          )}

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: D.inverseSurface, letterSpacing: "-0.02em", margin: 0 }}>
              Welcome back, {firstName}
            </h1>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: planColor.text }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: planColor.dot, display: "inline-block" }} />
              {PLAN_LABELS[userPlan]} Plan
            </div>
          </div>
          <p style={{ fontSize: 13.5, color: D.onSurfaceVariant, margin: "0 0 0" }}>
            Your Vinexus workspace is ready.
          </p>

          {divider}

          {/* ── Download section ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "start" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: D.primary, letterSpacing: "0.08em", textTransform: "uppercase" as const, margin: "0 0 10px" }}>
                Vinexus Desktop
              </p>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: D.inverseSurface, letterSpacing: "-0.025em", margin: "0 0 8px", lineHeight: 1.3 }}>
                Connect to any VM. Code like you&apos;re local.
              </h2>
              <p style={{ fontSize: 13.5, color: D.onSurfaceVariant, lineHeight: 1.7, margin: "0 0 20px", maxWidth: 460 }}>
                A full VS Code–grade IDE that SSH-tunnels into your cloud VMs. Monaco Editor, integrated terminal, file tree, Git — your credentials never touch our servers.
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <a href={MAC_URL} style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "9px 20px", background: D.inverseSurface, color: D.surface,
                  borderRadius: 9999, fontSize: 13, fontWeight: 700, textDecoration: "none",
                }}>
                  <svg width="13" height="13" viewBox="0 0 814 1000" fill="currentColor"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-150.3-93.2C-17.1 770.3-41 568 61.2 419.2c41.6-57.7 108.3-97.4 178.7-99.6 65.7-2 126.4 43 166.8 43 39.5 0 112.4-50.3 189.4-50.3 47.4.8 156.8 15.6 228.4 122.6zm-147.2-122.3c30.7-36.2 51.2-86.7 51.2-137.1 0-7.1-.5-14.3-1.7-20.1-48.6 1.8-106.6 33.3-141.5 75.6-27.5 30.7-52.4 80.6-52.4 131.7 0 7.6 1.3 15.3 1.9 17.8 3 .6 7.8 1.3 12.6 1.3 44.1 0 97.6-29.8 129.9-69.2z"/></svg>
                  Download for macOS
                </a>
                <a href={WIN_URL} style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "9px 20px", background: "transparent", color: D.onSurface,
                  borderRadius: 9999, fontSize: 13, fontWeight: 600, textDecoration: "none",
                  border: `1.5px solid ${D.outlineVariant}`,
                }}>
                  <svg width="11" height="11" viewBox="0 0 88 88" fill="currentColor"><path d="M0 12.4L35.7 7.6l.02 34.43L0 42.1zm35.67 33.47l.03 34.48L.01 75.19V46.08zm4.28-39.2L87.3 0v41.53l-47.35.4zm47.38 41.43L87.3 88 40.0 81.29l-.06-34.5z"/></svg>
                  Download for Windows
                </a>
              </div>
              <p style={{ fontSize: 11, color: D.onSurfaceVariant, margin: "10px 0 0" }}>macOS 12+ · Windows 10+ · ARM & x86_64</p>
            </div>
          </div>

          {divider}

          {/* ── Two-column: links + plan ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>

            {/* Left: quick links */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: D.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" as const, margin: "0 0 16px" }}>
                Quick links
              </p>
              {[
                {
                  href: "/docs",
                  label: "Documentation",
                  sub: "Guides, API reference, setup tutorials",
                  color: "#3b82f6",
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
                },
                {
                  href: "/docs#claude-integration",
                  label: "Claude Code Integration",
                  sub: "AI pair programming on your VM",
                  color: "#ec4899",
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
                },
                {
                  href: "/account",
                  label: "Account & Billing",
                  sub: "Profile, subscription and payment",
                  color: "#8b5cf6",
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                },
              ].map((item) => (
                <Link key={item.href} href={item.href} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 0",
                    borderBottom: `1px solid ${D.outlineVariant}`,
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: `${item.color}12`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: item.color,
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: D.inverseSurface }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: D.onSurfaceVariant, marginTop: 1 }}>{item.sub}</div>
                    </div>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={D.outlineVariant} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </div>
                </Link>
              ))}
            </div>

            {/* Right: plan + claude */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: D.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" as const, margin: "0 0 16px" }}>
                Your Plan
              </p>

              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: D.inverseSurface, letterSpacing: "-0.03em" }}>
                  {PLAN_PRICES[userPlan]}
                  <span style={{ fontSize: 13, fontWeight: 400, color: D.onSurfaceVariant }}>
                    {userPlan !== "enterprise" ? " /month" : ""}
                  </span>
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: planColor.text }}>{PLAN_LABELS[userPlan]}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {[
                  { label: "VM connections", value: features.maxVmConnections === -1 ? "Unlimited" : String(features.maxVmConnections) },
                  { label: "AI requests / day", value: features.aiRequestsPerDay === -1 ? "Unlimited" : String(features.aiRequestsPerDay) },
                  { label: "Deploy automation", on: features.deployAutomation },
                  { label: "Priority support", on: features.prioritySupport },
                ].map((f, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 0",
                    borderBottom: `1px solid ${D.outlineVariant}`,
                  }}>
                    <span style={{ fontSize: 13, color: D.onSurfaceVariant }}>{f.label}</span>
                    {"value" in f ? (
                      <span style={{ fontSize: 13, fontWeight: 600, color: D.inverseSurface }}>{f.value}</span>
                    ) : (
                      f.on
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.outlineVariant} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    )}
                  </div>
                ))}
              </div>

              {isUpgradeable && (
                <Link href="/pricing" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px 0", borderRadius: 9999, marginTop: 20,
                  background: D.primary, color: "#fff",
                  fontSize: 13, fontWeight: 700, textDecoration: "none",
                }}>
                  Upgrade Plan
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              )}

              {/* Claude promo — flat, no card */}
              <div style={{ marginTop: 32 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#ec4899", letterSpacing: "0.08em", textTransform: "uppercase" as const, margin: "0 0 8px" }}>
                  Claude Code
                </p>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: D.inverseSurface, margin: "0 0 6px" }}>
                  AI pair programming on your VM
                </p>
                <p style={{ fontSize: 12.5, color: D.onSurfaceVariant, lineHeight: 1.65, margin: "0 0 12px" }}>
                  Run Claude Code in the Vinexus terminal with your own Anthropic API key — available on all plans.
                </p>
                <Link href="/docs#claude-integration" style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 12.5, fontWeight: 600, color: "#ec4899", textDecoration: "none",
                }}>
                  Setup Guide
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
