"use client";
import React from "react";
import Link from "next/link";
import { useTheme, Theme } from "@/lib/ThemeContext";

function Btn({ href, children, primary, D }: { href: string; children: React.ReactNode; primary?: boolean; D: Theme }) {
  return (
    <Link href={href} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 14px",
      borderRadius: 4,
      fontSize: 13,
      fontWeight: primary ? 600 : 500,
      textDecoration: "none",
      background: primary ? D.primary : "transparent",
      color: primary ? "#fff" : D.onSurfaceVariant,
      border: "none",
    }}>
      {children}
    </Link>
  );
}

function IDEMockup({ D }: { D: Theme }) {
  return (
    <div style={{
      background: D.termBg,
      border: `1px solid ${D.termBorder}`,
      borderRadius: 8,
      overflow: "hidden",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    }}>
      {/* Title bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 14px",
        height: 36,
        background: D.termHeader,
        borderBottom: `1px solid ${D.termBorder}`,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#ff5f56","#febc2e","#28c840"].map(c => (
            <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />
          ))}
        </div>
        <span style={{ fontSize: 11, color: D.termMuted }}>vinexus — prod-server · ubuntu@192.168.1.10</span>
        <div style={{ width: 52 }} />
      </div>

      <div style={{ display: "flex", height: 260 }}>
        {/* Activity bar */}
        <div style={{ width: 40, background: D.termBg, borderRight: `1px solid ${D.termBorder}`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10, gap: 6 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>
        </div>

        {/* File tree */}
        <div style={{ width: 140, background: D.termHeader, borderRight: `1px solid ${D.termBorder}`, padding: "10px 0" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: D.termMuted, letterSpacing: "0.1em", padding: "0 10px 8px", textTransform: "uppercase" }}>Explorer</div>
          {[
            { name: "src", indent: 0, dir: true, open: true },
            { name: "index.ts", indent: 1, active: true },
            { name: "config.yml", indent: 1 },
            { name: ".env", indent: 1 },
            { name: "package.json", indent: 0 },
          ].map((f, i) => (
            <div key={i} style={{
              padding: `4px 10px 4px ${10 + f.indent * 12}px`,
              display: "flex", alignItems: "center", gap: 5,
              background: f.active ? "rgba(0,83,219,0.15)" : "transparent",
              borderLeft: f.active ? "2px solid #7C3AED" : "2px solid transparent",
              fontSize: 11, color: f.active ? "#e8f0ff" : D.termMuted,
            }}>
              <span style={{ fontSize: 10, opacity: 0.7 }}>{f.dir ? (f.open ? "▾" : "▸") : "◦"}</span>
              {f.name}
            </div>
          ))}
        </div>

        {/* Editor */}
        <div style={{ flex: 1, background: D.termBg, padding: "14px 0", overflowY: "hidden" }}>
          {([
            [1, <><span style={{color:D.termRed}}>import</span><span style={{color:D.termText}}> express </span><span style={{color:D.termRed}}>from</span><span style={{color:D.termString}}> &apos;express&apos;</span></>],
            [2, <><span style={{color:D.termRed}}>const</span><span style={{color:D.termText}}> app </span><span style={{color:D.termRed}}>=</span><span style={{color:D.termBlue}}> express</span><span style={{color:D.termText}}>()</span></>],
            [3, null],
            [4, <><span style={{color:D.termText}}>app.</span><span style={{color:D.termBlue}}>get</span><span style={{color:D.termText}}>(</span><span style={{color:D.termString}}>&apos;/health&apos;</span><span style={{color:D.termText}}>, (req, res) =&gt; {"{"}</span></>],
            [5, <><span style={{color:D.termText}}>{"  "}res.</span><span style={{color:D.termBlue}}>json</span><span style={{color:D.termText}}>({"{"} </span><span style={{color:D.termPurple}}>status</span><span style={{color:D.termText}}>: </span><span style={{color:D.termString}}>&apos;ok&apos;</span><span style={{color:D.termText}}> {"}"})</span></>],
            [6, <span style={{color:D.termText}}>{"})"}</span>],
            [7, null],
            [8, <><span style={{color:D.termText}}>app.</span><span style={{color:D.termBlue}}>listen</span><span style={{color:D.termText}}>(</span><span style={{color:D.termOrange}}>3000</span><span style={{color:D.termText}}>)</span></>],
          ] as [number, React.ReactNode | null][]).map(([ln, code], i) => (
            <div key={i} style={{ padding: "0 16px", display: "flex", gap: 14, lineHeight: 1.75, whiteSpace: "nowrap" }}>
              <span style={{ color: D.termMuted, minWidth: 16, textAlign: "right", userSelect: "none", flexShrink: 0, fontSize: 11 }}>{ln}</span>
              <span style={{ fontSize: 12 }}>{code}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal tab bar */}
      <div style={{
        display: "flex", alignItems: "center",
        height: 28,
        background: D.termHeader,
        borderTop: `1px solid ${D.termBorder}`,
        padding: "0 4px",
      }}>
        {["Terminal", "Deploy", "AI Chat"].map((tab, i) => (
          <div key={tab} style={{
            padding: "0 12px", height: "100%", display: "flex", alignItems: "center",
            fontSize: 11,
            color: i === 0 ? "rgba(255,255,255,0.85)" : D.termMuted,
            borderBottom: i === 0 ? "2px solid #7C3AED" : "2px solid transparent",
          }}>
            {tab}
          </div>
        ))}
      </div>

      {/* Terminal */}
      <div style={{ background: D.termBg, padding: "10px 14px", lineHeight: 1.75, fontSize: 12 }}>
        <div>
          <span style={{ color: D.termGreen }}>ubuntu@prod-server</span>
          <span style={{ color: D.termMuted }}>:~$</span>
          <span style={{ color: D.termText, marginLeft: 8 }}>npm run build && pm2 restart app</span>
        </div>
        <div style={{ color: D.termGreen }}>✓ Build complete in 2.1s</div>
        <div style={{ color: D.termMuted }}>[PM2] Restarting app...</div>
        <div style={{ color: D.termGreen }}>[PM2] App restarted successfully.</div>
        <div>
          <span style={{ color: D.termGreen }}>ubuntu@prod-server</span>
          <span style={{ color: D.termMuted }}>:~$</span>
          <span style={{ color: D.termMuted, marginLeft: 8 }}>▌</span>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: "Monaco Editor",
    desc: "Full VS Code engine with IntelliSense, syntax highlighting for 50+ languages, multi-file tabs, and diff view.",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>,
  },
  {
    title: "Integrated Terminal",
    desc: "Real PTY session over SSH. Full terminal emulation with color support, tab completion, and scrollback.",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  },
  {
    title: "File Explorer",
    desc: "SFTP-backed file tree with live sync. Create, rename, delete, and navigate your VM's filesystem instantly.",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    title: "Git Source Control",
    desc: "Stage, commit, push, pull, and branch from within Vinexus. Visual diff and status indicators built in.",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>,
  },
  {
    title: "Server Management",
    desc: "Run systemctl commands, view logs, manage services, and deploy — all with safety levels and real-time output.",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  },
  {
    title: "Claude AI Integration",
    desc: "Run any AI pair programming tool — Claude Code, Aider, Cursor, or any terminal-based assistant — directly from the Vinexus integrated terminal.",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/><path d="M8 12h8M12 8v8"/></svg>,
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    features: ["1 VM connection", "Monaco editor", "Terminal & SFTP", "Git source control"],
    cta: "Download Free",
    href: "/download",
  },
  {
    name: "Premium",
    price: "$19",
    period: "/month",
    features: ["3 VM connections", "AI pair programming", "AI hints (50/day)", "Deploy automation"],
    cta: "Get Premium",
    href: "/pricing",
  },
  {
    name: "Max",
    price: "$49",
    period: "/month",
    badge: "Most Popular",
    features: ["Unlimited VMs", "Claude Sonnet AI", "500 AI requests/day", "Priority support"],
    cta: "Get Max",
    href: "/pricing",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Contact",
    period: "",
    features: ["Unlimited AI requests", "Custom integrations", "SSO & team mgmt", "Dedicated engineer"],
    cta: "Contact Us",
    href: "/contact",
  },
];

export default function LandingPage() {
  const { D } = useTheme();

  return (
    <div style={{ background: D.surface, color: D.onSurface }}>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ padding: "72px 24px 80px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))", gap: 64, alignItems: "center" }}>

          {/* Left */}
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 4,
              background: D.primaryContainer,
              fontSize: 11, fontWeight: 600, color: D.primary,
              marginBottom: 24, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: D.primary, display: "inline-block" }} />
              Native Desktop SSH IDE
            </div>

            <h1 style={{
              fontSize: "clamp(34px, 4.5vw, 56px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.08,
              margin: "0 0 20px",
              color: D.inverseSurface,
            }}>
              Your VM.<br />Your IDE.<br />Anywhere.
            </h1>

            <p style={{
              fontSize: 15, lineHeight: 1.7, color: D.onSurfaceVariant,
              maxWidth: 440, margin: "0 0 32px",
            }}>
              Vinexus is a native desktop IDE that connects directly to your virtual machines via SSH. Full Monaco editor, integrated terminal, file explorer, git, and deploy tools — no browser, no overhead.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
              <Btn href="/download" primary D={D}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Free
              </Btn>
              <Btn href="/pricing" D={D}>View Pricing</Btn>
            </div>

            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              {["256-bit Encrypted", "Direct SSH — no proxy", "No data stored"].map((label) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: D.onSurfaceVariant }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={D.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: IDE mockup */}
          <div>
            <IDEMockup D={D} />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section style={{
        background: D.surfaceContainerLow,
        borderTop: `1px solid ${D.outlineVariant}`,
        borderBottom: `1px solid ${D.outlineVariant}`,
        padding: "72px 24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: D.primary, marginBottom: 8 }}>How It Works</p>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.03em", margin: "0 0 12px" }}>
              Up and running in minutes
            </h2>
            <p style={{ fontSize: 14, color: D.onSurfaceVariant, maxWidth: 420, lineHeight: 1.65 }}>
              No configuration files, no agents, no complexity. Just download, connect, and code.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 16 }}>
            {[
              { num: "01", title: "Download Vinexus Desktop", desc: "Install the native app on macOS or Windows. No configuration required — just download and open." },
              { num: "02", title: "Connect Your VM via SSH", desc: "Enter your VM's IP, username, and SSH key or password. Vinexus connects directly — no proxy, no agents." },
              { num: "03", title: "Code, Deploy, Manage", desc: "Edit files in Monaco, run commands in the terminal, commit with Git, and deploy — your full workflow in one window." },
            ].map((step) => (
              <div key={step.num} style={{
                background: D.surfaceLowest,
                border: `1px solid ${D.outlineVariant}`,
                borderRadius: 8,
                padding: "24px 20px",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: D.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: D.inverseSurface, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 13, color: D.onSurfaceVariant, lineHeight: 1.65, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section id="features" style={{ padding: "80px 24px", background: D.surface }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: D.primary, marginBottom: 8 }}>Features</p>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.03em", margin: 0 }}>
              Everything you need in one IDE
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 12 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                background: D.surfaceLowest,
                border: `1px solid ${D.outlineVariant}`,
                borderRadius: 6,
                padding: "18px 16px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 4,
                  background: D.primaryContainer,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: D.inverseSurface, margin: "0 0 5px" }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 12, color: D.onSurfaceVariant, lineHeight: 1.65, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLAUDE INTEGRATION ────────────────────────────────── */}
      <section id="claude" style={{
        background: D.surfaceContainerLow,
        borderTop: `1px solid ${D.outlineVariant}`,
        borderBottom: `1px solid ${D.outlineVariant}`,
        padding: "80px 24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 4,
              background: D.primaryContainer,
              fontSize: 11, fontWeight: 600, color: D.primary,
              marginBottom: 20, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              AI Pair Programming
            </div>
            <h2 style={{ fontSize: "clamp(22px, 2.8vw, 36px)", fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 16px" }}>
              Any AI assistant,<br />directly in your terminal
            </h2>
            <p style={{ fontSize: 14, color: D.onSurfaceVariant, lineHeight: 1.75, margin: "0 0 14px" }}>
              Run Claude Code, Aider, or any terminal-based AI tool directly on your VM from the Vinexus integrated terminal. Full AI pair programming — available on any plan.
            </p>
            <p style={{ fontSize: 14, color: D.onSurfaceVariant, lineHeight: 1.75, margin: "0 0 28px" }}>
              Premium and Max plans also include built-in AI hints. Or bring your own API key and run any AI tool you prefer.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn href="/docs#claude-integration" primary D={D}>Read the Docs</Btn>
              <Btn href="/pricing" D={D}>Compare Plans</Btn>
            </div>
          </div>

          {/* Claude terminal mockup */}
          <div style={{
            background: D.termBg,
            border: `1px solid ${D.termBorder}`,
            borderRadius: 8,
            overflow: "hidden",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            lineHeight: 1.75,
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
          }}>
            <div style={{ background: D.termHeader, borderBottom: `1px solid ${D.termBorder}`, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", gap: 5 }}>
                {["#ff5f56","#febc2e","#28c840"].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />)}
              </div>
              <span style={{ fontSize: 11, color: D.termMuted, marginLeft: 8 }}>Terminal · claude-sonnet-4-6</span>
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div>
                <span style={{ color: D.termGreen }}>ubuntu@prod</span>
                <span style={{ color: D.termMuted }}>:~/app$</span>
                <span style={{ color: D.termText, marginLeft: 8 }}>claude</span>
              </div>
              <div style={{ color: D.termMuted, marginTop: 6 }}>Claude Code ready. Type a message or &apos;/help&apos;.</div>
              <div style={{ marginTop: 10 }}>
                <span style={{ color: D.termPurple }}>You:</span>
                <span style={{ color: D.termText, marginLeft: 8 }}>fix the memory leak in src/worker.ts</span>
              </div>
              <div style={{ marginTop: 6 }}>
                <span style={{ color: D.termBlue }}>Claude:</span>
                <span style={{ color: D.termText, marginLeft: 8 }}>I&apos;ll analyze worker.ts for memory leaks...</span>
              </div>
              <div style={{ color: D.termMuted, paddingLeft: 54, marginTop: 2 }}>Reading file src/worker.ts (142 lines)</div>
              <div style={{ color: D.termMuted, paddingLeft: 54 }}>Found: EventEmitter not unsubscribed in cleanup()</div>
              <div style={{ color: D.termGreen, paddingLeft: 54 }}>Applying fix... ✓ Done</div>
              <div style={{ marginTop: 10 }}>
                <span style={{ color: D.termGreen }}>ubuntu@prod</span>
                <span style={{ color: D.termMuted }}>:~/app$</span>
                <span style={{ color: D.termMuted, marginLeft: 8 }}>▌</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: D.surface }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: D.primary, marginBottom: 8 }}>Pricing</p>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.03em", margin: "0 0 10px" }}>
              Start free. Scale as you grow.
            </h2>
            <p style={{ fontSize: 14, color: D.onSurfaceVariant, maxWidth: 380, lineHeight: 1.65 }}>
              Every plan includes the full Monaco editor, terminal, and SSH connectivity.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12 }}>
            {PLANS.map((plan) => (
              <div key={plan.name} style={{
                background: plan.highlight ? D.surfaceLowest : D.surfaceContainerLow,
                border: plan.highlight ? `1px solid rgba(0,83,219,0.4)` : `1px solid ${D.outlineVariant}`,
                borderRadius: 8,
                padding: "20px 18px",
                display: "flex", flexDirection: "column",
                position: "relative",
              }}>
                {plan.badge && (
                  <div style={{
                    position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                    background: D.primary, color: "#fff",
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                    padding: "3px 10px", borderRadius: 4,
                    whiteSpace: "nowrap",
                  }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: D.inverseSurface, marginBottom: 6 }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em" }}>{plan.price}</span>
                    {plan.period && <span style={{ fontSize: 12, color: D.onSurfaceVariant }}>{plan.period}</span>}
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: D.onSurfaceVariant }}>
                      <svg style={{ flexShrink: 0, marginTop: 2 }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={D.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </div>
                  ))}
                </div>
                <Link href={plan.href} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "6px 0", borderRadius: 4, fontSize: 13, fontWeight: 600,
                  textDecoration: "none",
                  background: plan.highlight ? D.primary : "transparent",
                  color: plan.highlight ? "#fff" : D.onSurfaceVariant,
                  border: plan.highlight ? "none" : `1px solid ${D.outlineVariant}`,
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <Link href="/pricing" style={{ fontSize: 13, color: D.primary, textDecoration: "none", fontWeight: 500 }}>
              View full pricing comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────── */}
      <section style={{
        background: D.surfaceContainerLow,
        borderTop: `1px solid ${D.outlineVariant}`,
        padding: "80px 24px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em", lineHeight: 1.1, margin: "0 0 16px" }}>
            Ready to take control of<br />your infrastructure?
          </h2>
          <p style={{ fontSize: 15, color: D.onSurfaceVariant, margin: "0 auto 32px", lineHeight: 1.65 }}>
            Download Vinexus free and connect to your first VM in under 5 minutes.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn href="/download" primary D={D}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Free
            </Btn>
            <Btn href="/docs#claude-integration" D={D}>Read the Docs</Btn>
          </div>
        </div>
      </section>

    </div>
  );
}
