"use client";
import React from "react";
import { useSession, signOut } from "next-auth/react";
import { usePlan } from "@/contexts/PlanContext";
import Link from "next/link";

export default function AccountPage() {
  const { data: session } = useSession();
  const { plan, isPro } = usePlan();
  const emailVerified = (session as any)?.emailVerified;

  const handleManageBilling = async () => {
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Portal error:", err);
    }
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "40px 20px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <Link
          href="/dashboard"
          style={{
            color: "var(--text-secondary)",
            textDecoration: "none",
            fontSize: 13,
            marginBottom: 20,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            transition: "color 0.2s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </Link>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-bright)", marginBottom: 32 }}>
          Account
        </h1>

        {/* Profile Card */}
        <div className="surface" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--accent-surface)",
              border: "1px solid rgba(6, 182, 212, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent)",
              fontSize: 18,
              fontWeight: 700,
            }}>
              {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-bright)" }}>
                {session?.user?.name || "User"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                {session?.user?.email}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)", margin: "0 0 20px" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Name</span>
              <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                {session?.user?.name || "Not set"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Email</span>
              <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                {session?.user?.email}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Email Status</span>
              {emailVerified ? (
                <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Verified
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "#eab308", fontWeight: 500 }}>Not verified</span>
                  <button
                    className="btn btn-sm"
                    style={{
                      padding: "4px 10px",
                      fontSize: 12,
                      background: "rgba(234, 179, 8, 0.08)",
                      color: "#eab308",
                      border: "1px solid rgba(234, 179, 8, 0.15)",
                    }}
                    onClick={async () => {
                      await fetch("/api/auth/resend-verification", { method: "POST" });
                      alert("Verification email sent!");
                    }}
                  >
                    Resend
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="surface" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-bright)", margin: 0 }}>
              Subscription
            </h2>
            <span className={isPro ? "badge badge-accent" : "badge badge-neutral"}>
              {plan === "pro" ? "Pro" : "Free"}
            </span>
          </div>

          {isPro ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                You have access to all Pro features including AI insights, deploy, and server commands.
              </p>
              <button className="btn btn-secondary btn-md" onClick={handleManageBilling}>
                Manage Subscription
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                Upgrade to Pro to unlock deploy, server commands, and AI-powered insights.
              </p>
              <button className="btn btn-primary btn-md" onClick={handleUpgrade}>
                Upgrade to Pro — $10/mo
              </button>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <button
          className="btn btn-ghost"
          style={{
            color: "var(--danger)",
            padding: "10px 20px",
            border: "1px solid rgba(239, 68, 68, 0.15)",
            borderRadius: "var(--radius-md)",
            marginTop: 8,
          }}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
