"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/lib/ThemeContext";

interface SubInfo {
  planKey: string;
  planName: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}

const PLAN_DISPLAY: Record<string, { label: string; color: string }> = {
  free:       { label: "Free",       color: "#8b949e" },
  premium:    { label: "Premium",    color: "#4493f8" },
  max:        { label: "Max",        color: "#a371f7" },
  enterprise: { label: "Enterprise", color: "#3fb950" },
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

export default function AccountPage() {
  const { D } = useTheme();
  const { data: session } = useSession();
  const router = useRouter();
  const emailVerified = (session as any)?.emailVerified;

  const [activeTab, setActiveTab] = useState<"profile" | "subscription">("profile");
  const [sub, setSub] = useState<SubInfo | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSub = useCallback(async () => {
    setSubLoading(true);
    try {
      const res = await fetch("/api/billing/subscription");
      if (res.ok) setSub(await res.json());
    } finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => { fetchSub(); }, [fetchSub]);

  const handleCancel = async () => {
    setActionLoading("cancel");
    setConfirmCancel(false);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "Failed to cancel.", "err"); return; }
      showToast(`Subscription cancelled. Access continues until ${fmt(data.accessUntil)}.`, "ok");
      await fetchSub();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async () => {
    setActionLoading("reactivate");
    try {
      const res = await fetch("/api/billing/reactivate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "Failed to reactivate.", "err"); return; }
      if (data.url) { window.location.href = data.url; return; }
      showToast("Subscription reactivated! Billing will continue as normal.", "ok");
      await fetchSub();
    } finally {
      setActionLoading(null);
    }
  };

  const handlePortal = async () => {
    setActionLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else showToast(data.error ?? "Could not open billing portal.", "err");
    } finally {
      setActionLoading(null);
    }
  };

  const planMeta = PLAN_DISPLAY[sub?.planKey ?? "free"] ?? PLAN_DISPLAY.free;
  const isPaid = sub && sub.planKey !== "free" && sub.status !== "canceled";
  const isCanceling = isPaid && sub?.cancelAtPeriodEnd;
  const isExpired = sub?.status === "canceled";

  const btnPrimary: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "10px 20px", borderRadius: 9999, fontSize: 13, fontWeight: 600,
    cursor: "pointer", border: "none", fontFamily: "inherit",
    background: D.inverseSurface, color: D.surface,
    transition: "opacity 0.15s",
  };

  const btnSecondary: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "10px 20px", borderRadius: 9999, fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
    background: "transparent", color: D.onSurfaceVariant,
    border: `1.5px solid ${D.outlineVariant}`,
    transition: "opacity 0.15s",
  };

  const btnDanger: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "10px 20px", borderRadius: 9999, fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
    background: "transparent", color: "#f85149",
    border: "1.5px solid rgba(248,81,73,0.25)",
    transition: "opacity 0.15s",
  };

  const navItems = [
    { id: "profile" as const, label: "Profile", Icon: UserIcon },
    { id: "subscription" as const, label: "Subscription", Icon: CreditCardIcon },
  ];

  const initials = (session?.user?.name?.[0] || session?.user?.email?.[0] || "?").toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: D.surface, display: "flex" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          padding: "12px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
          background: toast.type === "ok" ? "#15803d" : "#b91c1c", color: "#fff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <div style={{
        width: 220,
        flexShrink: 0,
        borderRight: `1px solid ${D.outlineVariant}`,
        background: D.surfaceContainerLow,
        display: "flex",
        flexDirection: "column",
        padding: "32px 0",
      }}>

        {/* User info */}
        <div style={{ padding: "0 20px 24px" }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: D.primaryContainer,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: D.primary, fontSize: 20, fontWeight: 800,
            marginBottom: 14, letterSpacing: "-0.02em",
          }}>
            {initials}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: D.inverseSurface, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            {session?.user?.name || "User"}
          </div>
          <div style={{ fontSize: 12, color: D.onSurfaceVariant, marginTop: 3, marginBottom: 10 }}>
            {session?.user?.email}
          </div>
          <span style={{
            display: "inline-block",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "2px 8px", borderRadius: 4,
            background: `${planMeta.color}18`, color: planMeta.color,
            border: `1px solid ${planMeta.color}30`,
          }}>
            {subLoading ? "…" : planMeta.label}
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: D.outlineVariant, margin: "0 20px 12px" }} />

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
          {navItems.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 6,
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  color: isActive ? D.inverseSurface : D.onSurfaceVariant,
                  background: isActive ? D.surfaceContainer : "transparent",
                  transition: "background 0.15s, color 0.15s",
                  textAlign: "left",
                }}
              >
                <Icon />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Sign out */}
        <div style={{ padding: "0 8px" }}>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 6,
              border: "none", cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, fontWeight: 500, color: "#f85149",
              background: "transparent", width: "100%", textAlign: "left",
              transition: "background 0.15s",
            }}
          >
            <LogOutIcon />
            Sign out
          </button>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────── */}
      <div style={{ flex: 1, padding: "40px 48px", maxWidth: 660 }}>

        {/* Back link */}
        <Link href="/dashboard" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 13, color: D.onSurfaceVariant, textDecoration: "none",
          marginBottom: 28,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </Link>

        {/* ── PROFILE ─────────────────────────────────────────── */}
        {activeTab === "profile" && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
                Profile
              </h1>
              <p style={{ fontSize: 14, color: D.onSurfaceVariant, margin: 0, lineHeight: 1.6 }}>
                Your account details and verification status.
              </p>
            </div>

            {/* Rows */}
            <div style={{ borderTop: `1px solid ${D.outlineVariant}` }}>
              {/* Name */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "18px 0", borderBottom: `1px solid ${D.outlineVariant}`,
              }}>
                <span style={{ fontSize: 14, color: D.onSurfaceVariant, fontWeight: 500 }}>Name</span>
                <span style={{ fontSize: 14, color: D.onSurface, fontWeight: 500 }}>{session?.user?.name || "Not set"}</span>
              </div>

              {/* Email */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "18px 0", borderBottom: `1px solid ${D.outlineVariant}`,
              }}>
                <span style={{ fontSize: 14, color: D.onSurfaceVariant, fontWeight: 500 }}>Email</span>
                <span style={{ fontSize: 14, color: D.onSurface, fontWeight: 500 }}>{session?.user?.email}</span>
              </div>

              {/* Verified */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "18px 0", borderBottom: `1px solid ${D.outlineVariant}`,
              }}>
                <span style={{ fontSize: 14, color: D.onSurfaceVariant, fontWeight: 500 }}>Email verified</span>
                {emailVerified ? (
                  <span style={{ fontSize: 14, color: "#3fb950", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, color: "#d29922", fontWeight: 500 }}>Unverified</span>
                    <button
                      style={{ ...btnSecondary, padding: "4px 12px", fontSize: 12, color: "#d29922", borderColor: "rgba(210,153,34,0.3)", borderRadius: 9999 }}
                      onClick={async () => {
                        await fetch("/api/auth/resend-verification", { method: "POST" });
                        showToast("Verification email sent!", "ok");
                      }}
                    >
                      Resend
                    </button>
                  </span>
                )}
              </div>

              {/* Plan */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "18px 0", borderBottom: `1px solid ${D.outlineVariant}`,
              }}>
                <span style={{ fontSize: 14, color: D.onSurfaceVariant, fontWeight: 500 }}>Current plan</span>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, color: D.onSurface, fontWeight: 500 }}>
                    {subLoading ? "…" : planMeta.label}
                  </span>
                  <button style={{ ...btnSecondary, padding: "4px 12px", fontSize: 12, borderRadius: 9999 }} onClick={() => setActiveTab("subscription")}>
                    Manage
                  </button>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── SUBSCRIPTION ────────────────────────────────────── */}
        {activeTab === "subscription" && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
                Subscription
              </h1>
              <p style={{ fontSize: 14, color: D.onSurfaceVariant, margin: 0, lineHeight: 1.6 }}>
                Manage your plan and billing.
              </p>
            </div>

            {subLoading ? (
              <p style={{ fontSize: 14, color: D.onSurfaceVariant }}>Loading subscription…</p>
            ) : !isPaid && !isExpired ? (

              /* ── Free ── */
              <div>
                <div style={{ borderTop: `1px solid ${D.outlineVariant}` }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "18px 0", borderBottom: `1px solid ${D.outlineVariant}`,
                  }}>
                    <span style={{ fontSize: 14, color: D.onSurfaceVariant, fontWeight: 500 }}>Plan</span>
                    <span style={{ fontSize: 14, color: D.onSurface, fontWeight: 500 }}>Free</span>
                  </div>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "18px 0", borderBottom: `1px solid ${D.outlineVariant}`,
                  }}>
                    <span style={{ fontSize: 14, color: D.onSurfaceVariant, fontWeight: 500 }}>Features</span>
                    <span style={{ fontSize: 14, color: D.onSurface, fontWeight: 500 }}>Editor, terminal, file manager</span>
                  </div>
                </div>
                <div style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button style={btnPrimary} onClick={() => router.push("/pricing")}>
                    Upgrade to Premium — $19/mo
                  </button>
                  <button style={btnSecondary} onClick={() => router.push("/pricing")}>
                    View all plans
                  </button>
                </div>
                <p style={{ fontSize: 13, color: D.onSurfaceVariant, marginTop: 16, lineHeight: 1.65 }}>
                  Upgrade to unlock AI features, deploy automation, and server commands.
                </p>
              </div>

            ) : isExpired ? (

              /* ── Expired ── */
              <div>
                <div style={{
                  padding: "14px 16px", borderRadius: 8, fontSize: 14, lineHeight: 1.65,
                  background: "rgba(248,81,73,0.06)", border: "1px solid rgba(248,81,73,0.15)", color: "#f85149",
                  marginBottom: 24,
                }}>
                  Your {sub?.planName} subscription ended on {fmt(sub?.currentPeriodEnd ?? null)}.
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    style={{ ...btnPrimary, opacity: actionLoading === "reactivate" ? 0.6 : 1 }}
                    disabled={actionLoading === "reactivate"}
                    onClick={handleReactivate}
                  >
                    {actionLoading === "reactivate" ? "Loading…" : `Resubscribe to ${sub?.planName}`}
                  </button>
                  <button style={btnSecondary} onClick={() => router.push("/pricing")}>View all plans</button>
                </div>
              </div>

            ) : isCanceling ? (

              /* ── Canceling ── */
              <div>
                <div style={{
                  padding: "14px 16px", borderRadius: 8, fontSize: 14, lineHeight: 1.65,
                  background: "rgba(210,153,34,0.06)", border: "1px solid rgba(210,153,34,0.2)", color: "#d29922",
                  marginBottom: 24,
                }}>
                  Your {sub?.planName} plan will cancel on <strong>{fmt(sub?.currentPeriodEnd ?? null)}</strong>. You keep full access until then.
                </div>
                <div style={{ borderTop: `1px solid ${D.outlineVariant}` }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "18px 0", borderBottom: `1px solid ${D.outlineVariant}`,
                  }}>
                    <span style={{ fontSize: 14, color: D.onSurfaceVariant, fontWeight: 500 }}>Access until</span>
                    <span style={{ fontSize: 14, color: D.onSurface, fontWeight: 500 }}>{fmt(sub?.currentPeriodEnd ?? null)}</span>
                  </div>
                </div>
                <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    style={{ ...btnPrimary, opacity: actionLoading === "reactivate" ? 0.6 : 1 }}
                    disabled={actionLoading === "reactivate"}
                    onClick={handleReactivate}
                  >
                    {actionLoading === "reactivate" ? "Loading…" : "Keep my subscription"}
                  </button>
                  <button style={btnSecondary} onClick={handlePortal} disabled={actionLoading === "portal"}>
                    {actionLoading === "portal" ? "Loading…" : "Billing portal"}
                  </button>
                </div>
              </div>

            ) : (

              /* ── Active ── */
              <div>
                <div style={{ borderTop: `1px solid ${D.outlineVariant}` }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "18px 0", borderBottom: `1px solid ${D.outlineVariant}`,
                  }}>
                    <span style={{ fontSize: 14, color: D.onSurfaceVariant, fontWeight: 500 }}>Plan</span>
                    <span style={{ fontSize: 14, color: D.onSurface, fontWeight: 500 }}>{sub?.planName}</span>
                  </div>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "18px 0", borderBottom: `1px solid ${D.outlineVariant}`,
                  }}>
                    <span style={{ fontSize: 14, color: D.onSurfaceVariant, fontWeight: 500 }}>Status</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: sub?.status === "active" ? "#3fb950" : D.onSurfaceVariant, textTransform: "capitalize" }}>
                      {sub?.status}
                    </span>
                  </div>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "18px 0", borderBottom: `1px solid ${D.outlineVariant}`,
                  }}>
                    <span style={{ fontSize: 14, color: D.onSurfaceVariant, fontWeight: 500 }}>Next billing date</span>
                    <span style={{ fontSize: 14, color: D.onSurface, fontWeight: 500 }}>{fmt(sub?.currentPeriodEnd ?? null)}</span>
                  </div>
                </div>

                <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    style={{ ...btnSecondary, opacity: actionLoading === "portal" ? 0.6 : 1 }}
                    disabled={actionLoading === "portal"}
                    onClick={handlePortal}
                  >
                    {actionLoading === "portal" ? "Loading…" : "Billing portal"}
                  </button>
                  <button style={btnSecondary} onClick={() => router.push("/pricing")}>
                    Change plan
                  </button>
                </div>

                {/* Cancel */}
                <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${D.outlineVariant}` }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: D.inverseSurface, marginBottom: 4 }}>Cancel subscription</div>
                    <div style={{ fontSize: 13, color: D.onSurfaceVariant, lineHeight: 1.6 }}>
                      You'll keep access until the end of your billing period.
                    </div>
                  </div>

                  {confirmCancel ? (
                    <div style={{
                      padding: "16px", borderRadius: 8, fontSize: 14, lineHeight: 1.65,
                      background: "rgba(248,81,73,0.05)", border: "1px solid rgba(248,81,73,0.15)",
                    }}>
                      <p style={{ margin: "0 0 14px", color: D.onSurface }}>
                        Cancel your {sub?.planName} plan? You'll keep access until <strong>{fmt(sub?.currentPeriodEnd ?? null)}</strong>, then revert to the Free plan.
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          style={{ ...btnDanger, opacity: actionLoading === "cancel" ? 0.6 : 1 }}
                          disabled={actionLoading === "cancel"}
                          onClick={handleCancel}
                        >
                          {actionLoading === "cancel" ? "Cancelling…" : "Yes, cancel plan"}
                        </button>
                        <button style={btnSecondary} onClick={() => setConfirmCancel(false)}>
                          Keep subscription
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button style={btnDanger} onClick={() => setConfirmCancel(true)}>
                      Cancel plan
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
