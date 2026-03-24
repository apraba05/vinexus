"use client";
import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";

interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  premium: "Premium",
  max: "Max",
  "ai-pro": "AI Pro",
  enterprise: "Enterprise",
};

function AccountContent() {
  const { D } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const upgradeSuccess = searchParams.get("upgrade") === "success";

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(upgradeSuccess);
  const [signingOut, setSigningOut] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.replace("/login?next=/account");
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.replace("/login?next=/account"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(false), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleSaveName() {
    if (!nameInput.trim() || !user) return;
    setSavingName(true);
    const res = await fetch("/api/auth/update-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameInput.trim() }),
    });
    if (res.ok) {
      setUser({ ...user, name: nameInput.trim() });
      setEditingName(false);
    }
    setSavingName(false);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 88px)", display: "flex", alignItems: "center", justifyContent: "center", background: D.surface }}>
        <span style={{ fontSize: 14, color: D.onSurfaceVariant }}>Loading…</span>
      </div>
    );
  }

  if (!user) return null;

  const planLabel = PLAN_LABELS[user.plan] ?? user.plan;

  return (
    <div style={{ minHeight: "calc(100vh - 88px)", background: D.surface, padding: "60px 24px" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)",
          background: "#15803d", color: "#fff",
          padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 500,
          zIndex: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
          Plan upgraded successfully!
        </div>
      )}

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em", marginBottom: 8 }}>
          Account
        </h1>
        <p style={{ fontSize: 13, color: D.onSurfaceVariant, marginBottom: 36 }}>
          Manage your Vinexus account and subscription.
        </p>

        {/* Profile card */}
        <div style={{
          background: D.surfaceContainerLow,
          border: `1px solid ${D.outlineVariant}`,
          borderRadius: 10,
          padding: "24px 24px",
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: D.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            Profile
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: D.onSurfaceVariant }}>Name</span>
              {editingName ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                    style={{
                      fontSize: 14, fontWeight: 600, color: D.onSurface,
                      background: D.surface, border: `1px solid ${D.primary}`,
                      borderRadius: 4, padding: "2px 8px", outline: "none",
                      width: 160, fontFamily: "inherit",
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    style={{
                      fontSize: 12, fontWeight: 600, color: "#fff",
                      background: D.primary, border: "none", borderRadius: 4,
                      padding: "3px 10px", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {savingName ? "…" : "Save"}
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    style={{
                      fontSize: 12, color: D.onSurfaceVariant, background: "none",
                      border: "none", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: D.onSurface }}>{user.name || "—"}</span>
                  <button
                    onClick={() => { setNameInput(user.name || ""); setEditingName(true); }}
                    style={{
                      fontSize: 11, color: D.primary, background: "none",
                      border: "none", cursor: "pointer", fontFamily: "inherit",
                      padding: 0, textDecoration: "underline",
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
            <div style={{ borderTop: `1px solid ${D.outlineVariant}` }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: D.onSurfaceVariant }}>Email</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: D.onSurface }}>{user.email}</span>
            </div>
            <div style={{ borderTop: `1px solid ${D.outlineVariant}` }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: D.onSurfaceVariant }}>Plan</span>
              <span style={{
                fontSize: 13, fontWeight: 700, color: "#fff",
                background: user.plan === "free" ? D.onSurfaceVariant : D.primary,
                padding: "3px 10px", borderRadius: 4,
              }}>
                {planLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {user.plan === "free" && (
            <Link href="/pricing" style={{
              display: "block", textAlign: "center",
              padding: "10px 16px", borderRadius: 6,
              background: D.primary, color: "#fff",
              fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>
              Upgrade Plan
            </Link>
          )}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 6,
              border: `1px solid ${D.outlineVariant}`,
              background: "transparent",
              color: D.onSurfaceVariant,
              fontSize: 14,
              fontWeight: 500,
              cursor: signingOut ? "default" : "pointer",
              opacity: signingOut ? 0.6 : 1,
              fontFamily: "inherit",
            }}
          >
            {signingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountContent />
    </Suspense>
  );
}
