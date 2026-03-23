"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Client-side owner check — mirrors server-side logic in adminGuard.ts
function isOwnerEmail(email: string): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return email.toLowerCase().trim() === adminEmail.toLowerCase().trim();
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserRow {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  plan: string;
  planDisplayName: string;
  subscriptionStatus: string | null;
  subscriptionEnd: string | null;
}

interface Stats {
  grossMrr: number;
  stripeFees: number;
  anthropicEstimate: number;
  netMrr: number;
  activeSubscriptions: number;
  payingSubscriptions: number;
  adminGrantedSubscriptions: number;
  canceledSubscriptions: number;
  totalUsers: number;
  freeUsers: number;
  revenueByPlan: Record<string, { count: number; gross: number; name: string }>;
  recentActivity: {
    id: string;
    userName: string;
    userEmail: string;
    planName: string;
    planPrice: number;
    status: string;
    updatedAt: string;
  }[];
}

interface AiUsageData {
  period: { days: number; since: string };
  summary: { totalRequests: number; estimatedCostCents: number; estimatedCostDollars: number };
  topUsers: { userId: string; email: string; name: string | null; totalRequests: number; estimatedCostCents: number; byModel: Record<string, number> }[];
  dailySeries: { date: string; requests: number; costCents: number }[];
}

type Tab = "overview" | "users" | "ai-usage" | "security" | "create";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(cents: number) {
  const abs = Math.abs(cents / 100);
  const str = abs.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${cents < 0 ? "-" : ""}$${str}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PLAN_COLORS: Record<string, string> = {
  free:       "#6b7280",
  premium:    "#06b6d4",
  max:        "#8b5cf6",
  "ai-pro":   "#a855f7",
  enterprise: "#f59e0b",
};

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "var(--text-bright)", note }: {
  label: string; value: string; sub?: string; color?: string; note?: string;
}) {
  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      {sub  && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{sub}</div>}
      {note && <div style={{ fontSize: 11, color: "var(--text-muted, #555)", marginTop: 6, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 6 }}>{note}</div>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab]               = useState<Tab>("overview");
  const [users, setUsers]           = useState<UserRow[]>([]);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [aiUsage, setAiUsage]       = useState<AiUsageData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [aiDays, setAiDays]         = useState(30);

  // Create user form
  const [formName, setFormName]         = useState("");
  const [formEmail, setFormEmail]       = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole]         = useState("user");
  const [formPlan, setFormPlan]         = useState("");
  const [formAssignPro, setFormAssignPro] = useState(false);
  const [formLoading, setFormLoading]   = useState(false);
  const [formMsg, setFormMsg]           = useState<{ type: "success" | "error"; text: string } | null>(null);

  const userEmail = (session?.user as any)?.email ?? "";
  const isOwner = (session as any)?.role === "owner";

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.status === 403 || res.status === 401) { router.push("/app"); return; }
    const data = await res.json();
    setUsers(data.users || []);
  }, [router]);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const fetchAiUsage = useCallback(async (days: number) => {
    const res = await fetch(`/api/admin/ai-usage?days=${days}`);
    if (res.ok) setAiUsage(await res.json());
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isOwner) { router.push("/app"); return; }
    // Initial load only — AI days changes are handled by a separate effect below
    Promise.all([fetchUsers(), fetchStats(), fetchAiUsage(aiDays)]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, isOwner]);

  // Re-fetch AI usage when the period selector changes (not on initial mount)
  const aiDaysRef = React.useRef(aiDays);
  useEffect(() => {
    if (aiDaysRef.current === aiDays) return; // skip first render
    aiDaysRef.current = aiDays;
    fetchAiUsage(aiDays);
  }, [aiDays, fetchAiUsage]);

  const handleChangeRole = async (userId: string, newRole: string) => {
    setActionLoading(`role-${userId}`);
    await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    await fetchUsers();
    setActionLoading(null);
  };

  const handleGrantPro = async (userId: string) => {
    setActionLoading(userId);
    await fetch("/api/admin/grant-pro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    await Promise.all([fetchUsers(), fetchStats()]);
    setActionLoading(null);
  };

  const handleRevokePro = async (userId: string) => {
    setActionLoading(userId);
    await fetch("/api/admin/revoke-pro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    await Promise.all([fetchUsers(), fetchStats()]);
    setActionLoading(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMsg(null);
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName, email: formEmail, password: formPassword, role: formRole, assignPro: formAssignPro }),
    });
    const data = await res.json();
    if (!res.ok) { setFormMsg({ type: "error", text: data.error || "Failed" }); setFormLoading(false); return; }
    setFormMsg({ type: "success", text: `Created ${data.user.email}` });
    setFormName(""); setFormEmail(""); setFormPassword(""); setFormRole("user"); setFormAssignPro(false);
    await Promise.all([fetchUsers(), fetchStats()]);
    setFormLoading(false);
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.email.toLowerCase().includes(search.toLowerCase()) || (u.name || "").toLowerCase().includes(search.toLowerCase());
    const matchPlan   = planFilter === "all" || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview",  label: "Revenue" },
    { key: "users",     label: `Users (${users.length})` },
    { key: "ai-usage",  label: "AI Usage" },
    { key: "security",  label: "Security" },
    { key: "create",    label: "Create User" },
  ];

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 12, background: "var(--bg-primary)" }}>
        <div style={{ width: 28, height: 28, border: "3px solid rgba(6,182,212,0.2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link href="/app" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to IDE
          </Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-bright)", margin: "0 0 4px" }}>Admin Dashboard</h1>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Owner access — {userEmail}</p>
            </div>
            <div style={{ fontSize: 12, padding: "4px 10px", background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 4, fontWeight: 600 }}>
              OWNER
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "10px 20px", fontSize: 14, fontWeight: 500,
              color: tab === t.key ? "var(--accent)" : "var(--text-secondary)",
              background: "none", border: "none",
              borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Revenue Tab ─────────────────────────────────────────────────── */}
        {tab === "overview" && stats && (
          <>
            {/* Top revenue breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
              <StatCard
                label="Gross MRR"
                value={fmt(stats.grossMrr)}
                sub={`${stats.activeSubscriptions} active subscriber${stats.activeSubscriptions !== 1 ? "s" : ""}`}
                color="#10b981"
              />
              <StatCard
                label="Stripe Fees"
                value={`-${fmt(stats.stripeFees)}`}
                sub="2.9% + $0.30 per sub"
                color="#ef4444"
                note="Est. — exact fees in Stripe dashboard"
              />
              <StatCard
                label="AI Cost Est."
                value={`-${fmt(stats.anthropicEstimate)}`}
                sub="Anthropic API (monthly)"
                color="#f59e0b"
                note="Based on 20% avg daily usage"
              />
              <StatCard
                label="Net Profit Est."
                value={fmt(stats.netMrr)}
                sub="After Stripe + Anthropic"
                color={stats.netMrr >= 0 ? "#10b981" : "#ef4444"}
              />
            </div>

            {/* Secondary stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
              <StatCard label="Total Users"       value={String(stats.totalUsers)}                color="var(--text-bright)" />
              <StatCard label="Free Users"        value={String(stats.freeUsers)}                 color="var(--text-secondary)" sub="No subscription" />
              <StatCard label="Paying (Stripe)"   value={String(stats.payingSubscriptions)}       color="var(--accent)" sub="Counts toward revenue" />
              <StatCard label="Admin Granted"     value={String(stats.adminGrantedSubscriptions)} color="#f59e0b" sub="Not counted in revenue" note="Complimentary access you granted" />
            </div>

            {/* Revenue by plan */}
            {Object.keys(stats.revenueByPlan).length > 0 && (
              <div className="surface" style={{ padding: 0, marginBottom: 24, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-bright)", margin: 0 }}>Revenue by Plan</h3>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Subscribers</th>
                      <th>Gross/mo</th>
                      <th>After Stripe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.revenueByPlan).map(([planKey, p]) => {
                      const stripePerPlan = Math.round(p.gross * 0.029 + p.count * 30);
                      return (
                        <tr key={planKey}>
                          <td>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: PLAN_COLORS[planKey] ?? "#6b7280", flexShrink: 0 }} />
                              <span style={{ fontWeight: 500, color: "var(--text-bright)", textTransform: "capitalize" }}>{p.name}</span>
                            </span>
                          </td>
                          <td style={{ color: "var(--text-secondary)" }}>{p.count}</td>
                          <td style={{ color: "#10b981", fontWeight: 500 }}>{fmt(p.gross)}</td>
                          <td style={{ color: "var(--text-bright)" }}>{fmt(p.gross - stripePerPlan)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Recent activity */}
            <div className="surface" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-bright)", margin: 0 }}>Recent Subscriptions</h3>
              </div>
              <table className="data-table">
                <thead><tr><th>User</th><th>Plan</th><th>Value/mo</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {stats.recentActivity.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 500, color: "var(--text-bright)", fontSize: 13 }}>{a.userName}</div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{a.userEmail}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                          background: `${PLAN_COLORS[a.planName.toLowerCase()] ?? "#6b7280"}22`,
                          color: PLAN_COLORS[a.planName.toLowerCase()] ?? "#6b7280" }}>
                          {a.planName}
                        </span>
                      </td>
                      <td style={{ color: "#10b981", fontWeight: 500, fontSize: 13 }}>{fmt(a.planPrice)}</td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                          background: ["active","trialing"].includes(a.status) ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          color: ["active","trialing"].includes(a.status) ? "#10b981" : "#ef4444" }}>
                          {a.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{fmtDate(a.updatedAt)}</td>
                    </tr>
                  ))}
                  {stats.recentActivity.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>No subscription activity yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Users Tab ───────────────────────────────────────────────────── */}
        {tab === "users" && (
          <>
            {/* Counters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              {["all", "free", "premium", "max", "enterprise"].map(p => {
                const count = p === "all" ? users.length : users.filter(u => u.plan === p).length;
                const active = planFilter === p;
                return (
                  <button key={p} onClick={() => setPlanFilter(p)} style={{
                    padding: "6px 14px", fontSize: 13, fontWeight: active ? 600 : 400, borderRadius: 5,
                    background: active ? `${PLAN_COLORS[p] ?? "var(--accent)"}22` : "rgba(255,255,255,0.03)",
                    color: active ? (PLAN_COLORS[p] ?? "var(--accent)") : "var(--text-secondary)",
                    border: `1px solid ${active ? (PLAN_COLORS[p] ?? "var(--accent)") + "44" : "rgba(255,255,255,0.06)"}`,
                    cursor: "pointer", textTransform: "capitalize",
                  }}>
                    {p === "all" ? "All" : p} <span style={{ opacity: 0.6 }}>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 18 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input className="auth-input" style={{ flex: 1, background: "transparent", border: "none", padding: 0, boxShadow: "none" }}
                type="text" placeholder="Search email or name..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="surface" style={{ overflow: "hidden", padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr><th>User</th><th>Plan</th><th>Role</th><th>Status</th><th>Verified</th><th>Joined</th><th style={{ textAlign: "right" }}>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-surface)", border: "1px solid rgba(6,182,212,0.12)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                            {u.image
                              ? <img src={u.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{(u.name || u.email)[0].toUpperCase()}</span>
                            }
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, color: "var(--text-bright)", fontSize: 13 }}>{u.name || "—"}</div>
                            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 4, textTransform: "capitalize",
                            background: `${PLAN_COLORS[u.plan] ?? "#6b7280"}22`,
                            color: PLAN_COLORS[u.plan] ?? "#6b7280" }}>
                            {u.planDisplayName}
                          </span>
                          {(u as any).isAdminGrant && u.plan !== "free" && (
                            <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 3,
                              background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                              GRANTED
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {u.role === "admin"
                          ? <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>OWNER</span>
                          : (
                            <select
                              value={u.role}
                              disabled={actionLoading === `role-${u.id}`}
                              onChange={e => handleChangeRole(u.id, e.target.value)}
                              style={{ fontSize: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, color: u.role === "staff" ? "var(--accent)" : "var(--text-secondary)", padding: "2px 6px", cursor: "pointer" }}
                            >
                              <option value="user">user</option>
                              <option value="staff">staff</option>
                            </select>
                          )
                        }
                      </td>
                      <td>
                        {u.subscriptionStatus
                          ? <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
                              background: ["active","trialing"].includes(u.subscriptionStatus) ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                              color: ["active","trialing"].includes(u.subscriptionStatus) ? "#10b981" : "#ef4444" }}>
                              {u.subscriptionStatus}
                            </span>
                          : <span style={{ fontSize: 11, color: "var(--text-muted, #555)" }}>—</span>
                        }
                      </td>
                      <td>
                        {u.emailVerified
                          ? <span style={{ color: "#10b981", fontSize: 13 }}>✓</span>
                          : <span style={{ color: "#ef4444", fontSize: 13 }}>✗</span>
                        }
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{fmtDate(u.createdAt)}</td>
                      <td style={{ textAlign: "right" }}>
                        {u.role !== "admin" && (
                          u.plan !== "free"
                            ? <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", border: "1px solid rgba(239,68,68,0.12)" }}
                                onClick={() => handleRevokePro(u.id)} disabled={actionLoading === u.id}>
                                {actionLoading === u.id ? "..." : "Revoke"}
                              </button>
                            : <button className="btn btn-ghost btn-sm" style={{ color: "var(--accent)", border: "1px solid rgba(6,182,212,0.15)" }}
                                onClick={() => handleGrantPro(u.id)} disabled={actionLoading === u.id}>
                                {actionLoading === u.id ? "..." : "Grant Pro"}
                              </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>No users match</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── AI Usage Tab ────────────────────────────────────────────────── */}
        {tab === "ai-usage" && (
          <>
            {/* Period selector + summary */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Show last:</span>
              {[7, 14, 30, 90].map(d => (
                <button key={d} onClick={() => { setAiDays(d); fetchAiUsage(d); }} style={{
                  padding: "5px 14px", fontSize: 12, fontWeight: aiDays === d ? 600 : 400, borderRadius: 5,
                  background: aiDays === d ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.03)",
                  color: aiDays === d ? "var(--accent)" : "var(--text-secondary)",
                  border: `1px solid ${aiDays === d ? "rgba(6,182,212,0.25)" : "rgba(255,255,255,0.06)"}`,
                  cursor: "pointer",
                }}>{d} days</button>
              ))}
            </div>

            {aiUsage && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
                  <StatCard label="Total AI Requests"   value={aiUsage.summary.totalRequests.toLocaleString()} color="var(--accent)"   sub={`Last ${aiUsage.period.days} days`} />
                  <StatCard label="Est. Anthropic Cost"  value={`$${aiUsage.summary.estimatedCostDollars.toFixed(2)}`} color="#f59e0b" sub="Based on token estimates" />
                  <StatCard label="Cost per Request"    value={aiUsage.summary.totalRequests > 0 ? `$${(aiUsage.summary.estimatedCostDollars / aiUsage.summary.totalRequests).toFixed(4)}` : "$0"} color="var(--text-secondary)" />
                </div>

                {/* Daily sparkline — simple bar chart using divs */}
                {aiUsage.dailySeries.length > 0 && (
                  <div className="surface" style={{ padding: "18px 20px", marginBottom: 24 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-bright)", margin: "0 0 14px" }}>Daily Requests</h3>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}>
                      {(() => {
                        const max = Math.max(...aiUsage.dailySeries.map(d => d.requests), 1);
                        return aiUsage.dailySeries.map(d => (
                          <div key={d.date} title={`${d.date}: ${d.requests} reqs`} style={{
                            flex: 1, minWidth: 4,
                            height: `${Math.max(4, (d.requests / max) * 60)}px`,
                            background: "var(--accent)", opacity: 0.7, borderRadius: "2px 2px 0 0",
                          }} />
                        ));
                      })()}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted, #555)", marginTop: 5 }}>
                      <span>{aiUsage.dailySeries[0]?.date}</span>
                      <span>{aiUsage.dailySeries.at(-1)?.date}</span>
                    </div>
                  </div>
                )}

                {/* Top users table */}
                <div className="surface" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-bright)", margin: 0 }}>Top Users by API Usage</h3>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr><th>User</th><th>Requests</th><th>Est. Cost</th><th>Haiku</th><th>Sonnet</th><th>Opus</th></tr>
                    </thead>
                    <tbody>
                      {aiUsage.topUsers.map(u => (
                        <tr key={u.userId}>
                          <td>
                            <div style={{ fontWeight: 500, color: "var(--text-bright)", fontSize: 13 }}>{u.name || "—"}</div>
                            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{u.email}</div>
                          </td>
                          <td style={{ fontWeight: 600, color: "var(--accent)" }}>{u.totalRequests.toLocaleString()}</td>
                          <td style={{ color: "#f59e0b" }}>${(u.estimatedCostCents / 100).toFixed(3)}</td>
                          <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{(u.byModel["claude-haiku-4-5-20251001"] ?? 0).toLocaleString()}</td>
                          <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{(u.byModel["claude-sonnet-4-6"] ?? 0).toLocaleString()}</td>
                          <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{(u.byModel["claude-opus-4-6"] ?? 0).toLocaleString()}</td>
                        </tr>
                      ))}
                      {aiUsage.topUsers.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>No AI usage recorded yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Security Tab ────────────────────────────────────────────────── */}
        {tab === "security" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
              <StatCard label="Admin Lock"  value="Owner Only" color="#10b981" sub={`ADMIN_EMAIL env required`} />
              <StatCard label="AI Guardrails" value="Active" color="#10b981" sub="Prompt injection + content policy" />
              <StatCard label="Rate Limiting" value="Active" color="#10b981" sub="Per-user daily + per-IP API limits" />
            </div>

            <div className="surface" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-bright)", marginTop: 0, marginBottom: 16 }}>Security Measures in Place</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["Admin access", "Double-gated: role=admin AND email=ADMIN_EMAIL env var. Fails closed if ADMIN_EMAIL not set."],
                  ["Content Security Policy", "Strict CSP headers on all routes. frame-ancestors 'none' prevents clickjacking."],
                  ["HSTS", "Strict-Transport-Security with preload. Forces HTTPS for all connections."],
                  ["Auth rate limiting", "10 req/60s on auth routes to prevent brute-force attacks."],
                  ["AI rate limiting", "Per-user daily limits by plan (50/500/unlimited). Per-IP burst limiting on API routes."],
                  ["Prompt injection detection", "Regex patterns catch jailbreak attempts, role overrides, and system prompt injections."],
                  ["Harmful content policy", "Blocks requests for malware, attack tools, CSAM, and other prohibited content."],
                  ["Abuse tracking", "Users blocked after 3 policy violations within 24 hours. Tracked per userId."],
                  ["Secret scrubbing", "API keys, tokens, and credentials are redacted from all AI inputs before sending to Anthropic."],
                  ["Input sanitization", "Email/password validated and length-capped on all auth routes. SQL injection prevented by Prisma parameterized queries."],
                  ["Password security", "bcrypt with 12 salt rounds. Passwords never logged or returned in API responses."],
                  ["Stripe webhooks", "Webhook signature verified with STRIPE_WEBHOOK_SECRET before processing."],
                  ["CSRF protection", "NextAuth CSRF tokens on all form actions. SameSite cookie policy."],
                  ["Email verification", "24-hour verification tokens. Accounts not fully active until email confirmed."],
                ].map(([name, desc]) => (
                  <div key={name} style={{ display: "flex", gap: 14, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ flexShrink: 0, color: "#10b981", marginTop: 1 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-bright)", marginBottom: 2 }}>{name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-bright)", marginTop: 0, marginBottom: 12 }}>Environment Variables Required</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["ADMIN_EMAIL",           "Your email address. The only account that can access this page."],
                  ["NEXTAUTH_SECRET",        "Random 32+ character secret for NextAuth JWT signing."],
                  ["STRIPE_WEBHOOK_SECRET",  "From Stripe dashboard → Webhooks. Verifies webhook authenticity."],
                  ["ANTHROPIC_API_KEY",      "Your Anthropic API key. Never expose client-side."],
                  ["DATABASE_URL",           "PostgreSQL connection string. Use SSL in production."],
                ].map(([key, desc]) => (
                  <div key={key} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <code style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--accent)", background: "rgba(6,182,212,0.08)", padding: "2px 7px", borderRadius: 3, whiteSpace: "nowrap" }}>{key}</code>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55, paddingTop: 2 }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Create User Tab ─────────────────────────────────────────────── */}
        {tab === "create" && (
          <div style={{ maxWidth: 480 }}>
            <div className="surface" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-bright)", marginTop: 0, marginBottom: 20 }}>Create New User</h3>

              {formMsg && (
                <div style={{ padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13,
                  background: formMsg.type === "success" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                  color: formMsg.type === "success" ? "#10b981" : "#ef4444",
                  border: `1px solid ${formMsg.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}` }}>
                  {formMsg.text}
                </div>
              )}

              <form onSubmit={handleCreateUser}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { label: "Name", type: "text", value: formName, set: setFormName, placeholder: "Jane Doe" },
                    { label: "Email *", type: "email", value: formEmail, set: setFormEmail, placeholder: "user@example.com", required: true },
                    { label: "Password *", type: "password", value: formPassword, set: setFormPassword, placeholder: "Min 8 characters", required: true, min: 8 },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>{f.label}</label>
                      <input className="auth-input" type={f.type} placeholder={f.placeholder} value={f.value}
                        onChange={e => f.set(e.target.value)} required={f.required} minLength={f.min}
                        style={{ width: "100%" }} />
                    </div>
                  ))}

                  <div>
                    <label style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>Role</label>
                    <select className="auth-input" value={formRole} onChange={e => setFormRole(e.target.value)} style={{ width: "100%", cursor: "pointer" }}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
                    <input type="checkbox" checked={formAssignPro} onChange={e => setFormAssignPro(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
                    Assign Pro subscription (1 year, no Stripe charge)
                  </label>

                  <button type="submit" className="btn" disabled={formLoading} style={{
                    marginTop: 4, width: "100%", padding: "10px 0",
                    background: "var(--accent)", color: "#fff", border: "none",
                    borderRadius: "var(--radius-md)", fontSize: 14, fontWeight: 500,
                    cursor: formLoading ? "not-allowed" : "pointer", opacity: formLoading ? 0.7 : 1,
                  }}>
                    {formLoading ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
