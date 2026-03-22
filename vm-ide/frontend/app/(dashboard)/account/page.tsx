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

export default function AccountPage() {
  const { D } = useTheme();
  const { data: session } = useSession();
  const router = useRouter();
  const emailVerified = (session as any)?.emailVerified;

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
      if (data.url) { window.location.href = data.url; return; } // expired → new checkout
      showToast("Subscription reactivated! Billing will continue as normal.", "ok");
      await fetchSub();
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpgrade = (planKey: string) => {
    router.push(`/pricing`);
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

  const S = {
    page:   { minHeight: "100vh", background: D.surface, padding: "40px 20px", color: D.onSurface },
    card:   { background: D.surfaceContainerLow, border: `1px solid ${D.outlineVariant}`, borderRadius: 8, padding: 28, marginBottom: 20 },
    label:  { fontSize: 13, color: D.onSurfaceVariant },
    value:  { fontSize: 13, color: D.onSurface, fontWeight: 500 as const },
    row:    { display: "flex" as const, justifyContent: "space-between" as const, alignItems: "center" as const },
    divider:{ height: 1, background: D.outlineVariant, margin: "20px 0" },
    btnPrimary: {
      display: "inline-flex" as const, alignItems: "center" as const, justifyContent: "center" as const,
      padding: "8px 16px", borderRadius: 4, fontSize: 13, fontWeight: 600 as const,
      cursor: "pointer", border: "none", fontFamily: "inherit",
      background: D.primary, color: "#fff",
    },
    btnSecondary: {
      display: "inline-flex" as const, alignItems: "center" as const, justifyContent: "center" as const,
      padding: "8px 16px", borderRadius: 4, fontSize: 13, fontWeight: 600 as const,
      cursor: "pointer", fontFamily: "inherit",
      background: "transparent", color: D.onSurfaceVariant,
      border: `1px solid ${D.outlineVariant}`,
    },
    btnDanger: {
      display: "inline-flex" as const, alignItems: "center" as const, justifyContent: "center" as const,
      padding: "8px 16px", borderRadius: 4, fontSize: 13, fontWeight: 600 as const,
      cursor: "pointer", fontFamily: "inherit",
      background: "transparent", color: "#f85149",
      border: "1px solid rgba(248,81,73,0.3)",
    },
  };

  return (
    <div style={S.page}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          padding: "12px 20px", borderRadius: 6, fontSize: 13, fontWeight: 500,
          background: toast.type === "ok" ? "#15803d" : "#b91c1c", color: "#fff",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <Link href="/app" style={{ color: D.onSurfaceVariant, textDecoration: "none", fontSize: 13, marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </Link>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: D.inverseSurface, margin: "12px 0 28px", letterSpacing: "-0.03em" }}>
          Account
        </h1>

        {/* ── Profile ──────────────────────────────────────────────── */}
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: D.primaryContainer, display: "flex", alignItems: "center", justifyContent: "center",
              color: D.primary, fontSize: 18, fontWeight: 700,
            }}>
              {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: D.inverseSurface }}>
                {session?.user?.name || "User"}
              </div>
              <div style={{ fontSize: 13, color: D.onSurfaceVariant, marginTop: 2 }}>
                {session?.user?.email}
              </div>
            </div>
          </div>

          <div style={S.divider} />

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={S.row}>
              <span style={S.label}>Name</span>
              <span style={S.value}>{session?.user?.name || "Not set"}</span>
            </div>
            <div style={S.row}>
              <span style={S.label}>Email</span>
              <span style={S.value}>{session?.user?.email}</span>
            </div>
            <div style={S.row}>
              <span style={S.label}>Email verified</span>
              {emailVerified ? (
                <span style={{ fontSize: 13, color: "#3fb950", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Verified
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "#d29922", fontWeight: 500 }}>Unverified</span>
                  <button style={{ ...S.btnSecondary, padding: "3px 10px", fontSize: 12, color: "#d29922", borderColor: "rgba(210,153,34,0.3)" }}
                    onClick={async () => { await fetch("/api/auth/resend-verification", { method: "POST" }); showToast("Verification email sent!", "ok"); }}>
                    Resend
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Subscription ─────────────────────────────────────────── */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: D.inverseSurface, margin: 0 }}>Subscription</h2>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "3px 10px", borderRadius: 4,
              background: `${planMeta.color}18`, color: planMeta.color,
              border: `1px solid ${planMeta.color}30`,
            }}>
              {subLoading ? "…" : planMeta.label}
            </span>
          </div>

          {subLoading ? (
            <p style={{ fontSize: 13, color: D.onSurfaceVariant, margin: 0 }}>Loading subscription…</p>
          ) : !isPaid && !isExpired ? (
            /* ── Free / no subscription ── */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: D.onSurfaceVariant, margin: 0, lineHeight: 1.65 }}>
                You're on the Free plan. Upgrade to Premium or Max to unlock AI features, deploy automation, and more.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={S.btnPrimary} onClick={() => handleUpgrade("premium")}>
                  Upgrade to Premium — $19/mo
                </button>
                <button style={S.btnSecondary} onClick={() => handleUpgrade("max")}>
                  View all plans
                </button>
              </div>
            </div>
          ) : isExpired ? (
            /* ── Expired subscription ── */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{
                padding: "10px 14px", borderRadius: 5, fontSize: 13, lineHeight: 1.6,
                background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.2)", color: "#f85149",
              }}>
                Your {sub?.planName} subscription ended on {fmt(sub?.currentPeriodEnd ?? null)}.
              </div>
              <button
                style={{ ...S.btnPrimary, opacity: actionLoading === "reactivate" ? 0.7 : 1 }}
                disabled={actionLoading === "reactivate"}
                onClick={handleReactivate}
              >
                {actionLoading === "reactivate" ? "Loading…" : `Resubscribe to ${sub?.planName}`}
              </button>
              <button style={S.btnSecondary} onClick={() => handleUpgrade("premium")}>View all plans</button>
            </div>
          ) : isCanceling ? (
            /* ── Active but scheduled to cancel ── */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{
                padding: "10px 14px", borderRadius: 5, fontSize: 13, lineHeight: 1.6,
                background: "rgba(210,153,34,0.08)", border: "1px solid rgba(210,153,34,0.25)", color: "#d29922",
              }}>
                Your {sub?.planName} plan will cancel on <strong>{fmt(sub?.currentPeriodEnd ?? null)}</strong>. You keep full access until then.
              </div>
              <div style={S.row}>
                <span style={S.label}>Current period ends</span>
                <span style={S.value}>{fmt(sub?.currentPeriodEnd ?? null)}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  style={{ ...S.btnPrimary, opacity: actionLoading === "reactivate" ? 0.7 : 1 }}
                  disabled={actionLoading === "reactivate"}
                  onClick={handleReactivate}
                >
                  {actionLoading === "reactivate" ? "Loading…" : "Keep my subscription"}
                </button>
                <button style={S.btnSecondary} onClick={handlePortal} disabled={actionLoading === "portal"}>
                  {actionLoading === "portal" ? "Loading…" : "Billing portal"}
                </button>
              </div>
            </div>
          ) : (
            /* ── Active subscription ── */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={S.row}>
                  <span style={S.label}>Plan</span>
                  <span style={S.value}>{sub?.planName}</span>
                </div>
                <div style={S.row}>
                  <span style={S.label}>Status</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: sub?.status === "active" ? "#3fb950" : D.onSurfaceVariant, textTransform: "capitalize" }}>
                    {sub?.status}
                  </span>
                </div>
                <div style={S.row}>
                  <span style={S.label}>Next billing date</span>
                  <span style={S.value}>{fmt(sub?.currentPeriodEnd ?? null)}</span>
                </div>
              </div>

              <div style={S.divider} />

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={{ ...S.btnSecondary, opacity: actionLoading === "portal" ? 0.7 : 1 }}
                  disabled={actionLoading === "portal"} onClick={handlePortal}>
                  {actionLoading === "portal" ? "Loading…" : "Billing portal"}
                </button>
                <button style={S.btnSecondary} onClick={() => router.push("/pricing")}>
                  Change plan
                </button>
              </div>

              {/* Cancel section */}
              <div style={{ ...S.divider, margin: "4px 0" }} />
              {confirmCancel ? (
                <div style={{
                  padding: "14px 16px", borderRadius: 6, fontSize: 13, lineHeight: 1.65,
                  background: "rgba(248,81,73,0.07)", border: "1px solid rgba(248,81,73,0.2)",
                }}>
                  <p style={{ margin: "0 0 12px", color: D.onSurface }}>
                    Cancel your {sub?.planName} plan? You'll keep access until <strong>{fmt(sub?.currentPeriodEnd ?? null)}</strong>, then revert to the Free plan. You can reactivate any time before that date.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={{ ...S.btnDanger, opacity: actionLoading === "cancel" ? 0.7 : 1 }}
                      disabled={actionLoading === "cancel"}
                      onClick={handleCancel}
                    >
                      {actionLoading === "cancel" ? "Cancelling…" : "Yes, cancel plan"}
                    </button>
                    <button style={S.btnSecondary} onClick={() => setConfirmCancel(false)}>
                      Keep subscription
                    </button>
                  </div>
                </div>
              ) : (
                <button style={{ ...S.btnDanger, alignSelf: "flex-start" as const }} onClick={() => setConfirmCancel(true)}>
                  Cancel plan
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Sign out ──────────────────────────────────────────────── */}
        <button
          style={{ ...S.btnDanger, marginTop: 4 }}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
