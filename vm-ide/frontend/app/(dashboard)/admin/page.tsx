"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  plan: string;
  subscriptionStatus: string | null;
}

interface Stats {
  activeSubscriptions: number;
  canceledSubscriptions: number;
  mrr: number;
  totalRevenue: number;
  recentActivity: {
    id: string;
    userName: string;
    userEmail: string;
    planName: string;
    status: string;
    updatedAt: string;
  }[];
}

type Tab = "overview" | "users" | "create";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Create user form
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("user");
  const [formAssignPro, setFormAssignPro] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isAdmin = (session as any)?.role === "admin";

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403 || res.status === 401) {
        router.push("/app");
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      console.error("Failed to fetch users");
    }
  }, [router]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      console.error("Failed to fetch stats");
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAdmin) {
      router.push("/app");
      return;
    }
    Promise.all([fetchUsers(), fetchStats()]).finally(() => setLoading(false));
  }, [session, status, isAdmin, router, fetchUsers, fetchStats]);

  const handleGrantPro = async (userId: string) => {
    setActionLoading(userId);
    try {
      await fetch("/api/admin/grant-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      await Promise.all([fetchUsers(), fetchStats()]);
    } catch {
      console.error("Failed to grant pro");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokePro = async (userId: string) => {
    setActionLoading(userId);
    try {
      await fetch("/api/admin/revoke-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      await Promise.all([fetchUsers(), fetchStats()]);
    } catch {
      console.error("Failed to revoke pro");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMessage(null);

    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
          assignPro: formAssignPro,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormMessage({ type: "error", text: data.error || "Failed to create user" });
        return;
      }

      setFormMessage({ type: "success", text: `User ${data.user.email} created successfully` });
      setFormName("");
      setFormEmail("");
      setFormPassword("");
      setFormRole("user");
      setFormAssignPro(false);
      await Promise.all([fetchUsers(), fetchStats()]);
    } catch {
      setFormMessage({ type: "error", text: "Failed to create user" });
    } finally {
      setFormLoading(false);
    }
  };

  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.name?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const proCount = users.filter((u) => u.plan === "pro").length;
  const freeCount = users.filter((u) => u.plan === "free").length;

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16, background: "var(--bg-primary)" }}>
        <div style={{ width: 32, height: 32, border: "3px solid rgba(6, 182, 212, 0.2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>Loading admin panel...</span>
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "create", label: "Create User" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link
            href="/app"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: 13,
              marginBottom: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to IDE
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-bright)", marginBottom: 4 }}>
            Admin Dashboard
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
            Manage users, subscriptions, and revenue
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: 0,
          marginBottom: 24,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 500,
                color: tab === t.key ? "var(--accent)" : "var(--text-secondary)",
                background: "none",
                border: "none",
                borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { value: stats ? formatCurrency(stats.totalRevenue) : "--", label: "Total Revenue", color: "#10b981" },
                { value: stats ? formatCurrency(stats.mrr) : "--", label: "Monthly Recurring", color: "var(--accent)" },
                { value: stats?.activeSubscriptions ?? "--", label: "Active Subs", color: "var(--text-bright)" },
                { value: stats?.canceledSubscriptions ?? "--", label: "Canceled", color: "var(--danger, #ef4444)" },
              ].map((stat, i) => (
                <div key={i} className="card" style={{ padding: "20px 24px" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, letterSpacing: "-0.02em" }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Use Features Button */}
            <div style={{ marginBottom: 24 }}>
              <Link
                href="/app"
                className="btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  background: "var(--accent)",
                  color: "#fff",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                Use Features
              </Link>
            </div>

            {/* Recent Activity */}
            <div className="surface" style={{ overflow: "hidden", padding: 0 }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-bright)", margin: 0 }}>
                  Recent Activity
                </h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentActivity.map((activity) => (
                    <tr key={activity.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500, color: "var(--text-bright)" }}>{activity.userName}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{activity.userEmail}</div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-accent">{activity.planName}</span>
                      </td>
                      <td>
                        <span className={
                          activity.status === "active" || activity.status === "trialing"
                            ? "badge badge-accent"
                            : "badge badge-neutral"
                        }>
                          {activity.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                          {new Date(activity.updatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
                        No subscription activity yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { value: users.length, label: "Total Users", color: "var(--text-bright)" },
                { value: proCount, label: "Pro Users", color: "var(--accent)" },
                { value: freeCount, label: "Free Users", color: "var(--text-secondary)" },
              ].map((stat, i) => (
                <div key={i} className="card" style={{ padding: "20px 24px" }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: stat.color, letterSpacing: "-0.02em" }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: "var(--radius-md)",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 20,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="auth-input"
                style={{ flex: 1, background: "transparent", border: "none", padding: 0, boxShadow: "none" }}
                type="text"
                placeholder="Search users by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Users Table */}
            <div className="surface" style={{ overflow: "hidden", padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Plan</th>
                    <th>Joined</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "var(--accent-surface)",
                            border: "1px solid rgba(6, 182, 212, 0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}>
                            {user.image ? (
                              <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>
                                {(user.name || user.email)?.[0]?.toUpperCase() || "?"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, color: "var(--text-bright)" }}>{user.name || "\u2014"}</div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 1 }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={user.role === "admin" ? "badge" : "badge badge-neutral"} style={
                          user.role === "admin" ? {
                            background: "rgba(245, 158, 11, 0.08)",
                            color: "#f59e0b",
                            border: "1px solid rgba(245, 158, 11, 0.15)",
                          } : {}
                        }>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={user.plan === "pro" ? "badge badge-accent" : "badge badge-neutral"}>
                          {user.plan}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                          {new Date(user.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {user.role !== "admin" && (
                          user.plan === "pro" ? (
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{
                                color: "var(--danger)",
                                border: "1px solid rgba(239, 68, 68, 0.12)",
                              }}
                              onClick={() => handleRevokePro(user.id)}
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? "..." : "Revoke Pro"}
                            </button>
                          ) : (
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{
                                color: "var(--accent)",
                                border: "1px solid rgba(6, 182, 212, 0.15)",
                              }}
                              onClick={() => handleGrantPro(user.id)}
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? "..." : "Grant Pro"}
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
                        {search ? "No users match your search" : "No users found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Create User Tab */}
        {tab === "create" && (
          <div style={{ maxWidth: 500 }}>
            <div className="surface" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-bright)", marginTop: 0, marginBottom: 20 }}>
                Create New User
              </h3>

              {formMessage && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  marginBottom: 16,
                  fontSize: 13,
                  background: formMessage.type === "success" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  color: formMessage.type === "success" ? "#10b981" : "#ef4444",
                  border: `1px solid ${formMessage.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"}`,
                }}>
                  {formMessage.text}
                </div>
              )}

              <form onSubmit={handleCreateUser}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
                      Name
                    </label>
                    <input
                      className="auth-input"
                      type="text"
                      placeholder="John Doe"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
                      Email *
                    </label>
                    <input
                      className="auth-input"
                      type="email"
                      placeholder="user@example.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
                      Password *
                    </label>
                    <input
                      className="auth-input"
                      type="password"
                      placeholder="Min 8 characters"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      required
                      minLength={8}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
                      Role
                    </label>
                    <select
                      className="auth-input"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      style={{ width: "100%", cursor: "pointer" }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    marginTop: 2,
                  }}>
                    <input
                      type="checkbox"
                      checked={formAssignPro}
                      onChange={(e) => setFormAssignPro(e.target.checked)}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    Assign Pro subscription (1 year, no Stripe)
                  </label>

                  <button
                    type="submit"
                    className="btn"
                    disabled={formLoading}
                    style={{
                      marginTop: 6,
                      width: "100%",
                      padding: "10px 0",
                      background: "var(--accent)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "var(--radius-md)",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: formLoading ? "not-allowed" : "pointer",
                      opacity: formLoading ? 0.7 : 1,
                    }}
                  >
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
