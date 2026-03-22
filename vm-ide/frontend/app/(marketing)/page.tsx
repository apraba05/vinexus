"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

const CountUp = dynamic(() => import("@/components/reactbits/CountUp"), { ssr: false });

// ── Glowing particle dots for dark navy background ──────────────────────────
const DOTS = Array.from({ length: 52 }, (_, i) => ({
  left: `${(i * 19 + 3) % 98}%`,
  top: `${(i * 27 + 5) % 94}%`,
  size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2.5 : 2,
  opacity: 0.18 + (i % 6) * 0.07,
  color: ["#3fffa2", "#4f8ef7", "#a78bfa", "#fca98d", "#ffffff"][i % 5],
}));

// ── Tool strip (circular icon buttons on dark surface) ──────────────────────
const TOOLS = [
  {
    label: "Monaco Editor",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>,
  },
  {
    label: "SSH Terminal",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>,
  },
  {
    label: "One-Click Deploy",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>,
  },
  {
    label: "AI Insights",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z" /><circle cx="12" cy="12" r="4" /></svg>,
  },
  {
    label: "File Manager",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>,
  },
  {
    label: "Server Cmds",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
  },
  {
    label: "SSH Connect",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>,
  },
  {
    label: "Multi-tab",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
  },
  {
    label: "Diff View",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>,
  },
];

// ── Feature cards with real product UI previews ──────────────────────────────
const FEATURES: { icon: React.ReactNode; title: string; desc: string; color: string; preview: React.ReactNode }[] = [
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3fffa2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>,
    title: "Monaco Editor",
    desc: "Full VS Code editing with syntax highlighting, IntelliSense, and multi-file tabs.",
    color: "#3fffa2",
    preview: (
      <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 0 }}>
          {["index.js", "config.yml", ".env"].map((t, i) => (
            <div key={t} style={{ padding: "5px 14px", fontSize: 10.5, color: i === 0 ? "#fff" : "rgba(255,255,255,0.35)", borderBottom: i === 0 ? "2px solid #3fffa2" : "2px solid transparent", background: i === 0 ? "rgba(63,255,162,0.05)" : "transparent" }}>{t}</div>
          ))}
        </div>
        <div style={{ padding: "10px 0", lineHeight: 1.7, background: "rgba(0,0,0,0.2)" }}>
          {[
            [" 1", <><span style={{color:"#a78bfa"}}>const</span><span style={{color:"rgba(255,255,255,0.7)"}}> express = </span><span style={{color:"#67e8f9"}}>require</span><span style={{color:"#86efac"}}>('express')</span></>],
            [" 2", <span style={{color:"rgba(255,255,255,0.7)"}}>const app = express();</span>],
            [" 3", null],
            [" 4", <><span style={{color:"rgba(255,255,255,0.7)"}}>app.</span><span style={{color:"#67e8f9"}}>get</span><span style={{color:"rgba(255,255,255,0.7)"}}>(</span><span style={{color:"#86efac"}}>'/'</span><span style={{color:"rgba(255,255,255,0.7)"}}>, (req, res) =&gt; {"{"}</span></>],
            [" 5", <><span style={{color:"rgba(255,255,255,0.7)"}}>{"  "}res.</span><span style={{color:"#67e8f9"}}>json</span><span style={{color:"rgba(255,255,255,0.7)"}}>({"{"}status: </span><span style={{color:"#86efac"}}>'ok'</span><span style={{color:"rgba(255,255,255,0.7)"}}>{"}"})</span></>],
            [" 6", <span style={{color:"rgba(255,255,255,0.7)"}}>{"});"}</span>],
          ].map(([ln, code], i) => (
            <div key={i} style={{ padding: "0 12px", display: "flex", gap: 12 }}>
              <span style={{ color: "rgba(255,255,255,0.2)", minWidth: 14, textAlign: "right" as const }}>{ln as string}</span>
              <span>{code as React.ReactNode}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>,
    title: "Integrated Terminal",
    desc: "xterm.js SSH terminal with direct access to your Linux virtual machines.",
    color: "#4f8ef7",
    preview: (
      <div style={{ borderRadius: 8, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 11, lineHeight: 1.8 }}>
        <div style={{ color: "rgba(255,255,255,0.35)", marginBottom: 4, fontSize: 10 }}>SSH · server01 · ubuntu@192.168.1.10</div>
        <div><span style={{ color: "#3fffa2" }}>ubuntu@server01</span><span style={{ color: "rgba(255,255,255,0.4)" }}>:</span><span style={{ color: "#4f8ef7" }}>~</span><span style={{ color: "rgba(255,255,255,0.4)" }}>$</span><span style={{ color: "rgba(255,255,255,0.8)", marginLeft: 8 }}>systemctl status nginx</span></div>
        <div style={{ color: "#22c55e" }}>● nginx.service - A high performance web server</div>
        <div style={{ color: "rgba(255,255,255,0.35)" }}>   Loaded: loaded (/lib/systemd/system/nginx.service)</div>
        <div><span style={{ color: "#22c55e" }}>   Active: active (running)</span><span style={{ color: "rgba(255,255,255,0.3)" }}> since 2h 14m</span></div>
        <div style={{ marginTop: 4 }}><span style={{ color: "#3fffa2" }}>ubuntu@server01</span><span style={{ color: "rgba(255,255,255,0.4)" }}>:</span><span style={{ color: "#4f8ef7" }}>~</span><span style={{ color: "rgba(255,255,255,0.4)" }}>$</span><span style={{ color: "rgba(255,255,255,0.55)", marginLeft: 8 }}>▌</span></div>
      </div>
    ),
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>,
    title: "One-Click Deploy",
    desc: "Push changes live with pre-validation, automatic backups, and instant rollback.",
    color: "#a78bfa",
    preview: (
      <div style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ background: "rgba(167,139,250,0.06)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "8px 14px", fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", justifyContent: "space-between" }}>
          <span>Deployment Pipeline</span><span style={{ color: "#a78bfa" }}>v2.4.1 → prod</span>
        </div>
        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column" as const, gap: 7 }}>
          {[
            { label: "Validate build", status: "done" },
            { label: "Run tests", status: "done" },
            { label: "Create backup", status: "done" },
            { label: "Deploy to production", status: "live" },
          ].map((step) => (
            <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: step.status === "live" ? "rgba(63,255,162,0.15)" : "rgba(34,197,94,0.1)", border: `1px solid ${step.status === "live" ? "#3fffa2" : "#22c55e"}`, flexShrink: 0 }}>
                {step.status === "live"
                  ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3fffa2", display: "block", boxShadow: "0 0 6px #3fffa2" }} />
                  : <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" /></svg>
                }
              </div>
              <span style={{ color: step.status === "live" ? "#fff" : "rgba(255,255,255,0.55)" }}>{step.label}</span>
              {step.status === "live" && <span style={{ marginLeft: "auto", fontSize: 9, background: "rgba(63,255,162,0.12)", color: "#3fffa2", padding: "2px 7px", borderRadius: 4, fontWeight: 600, letterSpacing: "0.05em" }}>LIVE</span>}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fca98d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z" /><circle cx="12" cy="12" r="4" /></svg>,
    title: "AI Insights",
    desc: "AI-powered file analysis, log diagnosis, and config validation via AWS Bedrock.",
    color: "#fca98d",
    preview: (
      <div style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", fontSize: 11 }}>
        <div style={{ background: "rgba(252,169,141,0.06)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "8px 14px", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fca98d", display: "inline-block", boxShadow: "0 0 5px #fca98d" }} />
          Analysing config.yml
        </div>
        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column" as const, gap: 7 }}>
          {[
            { icon: "⚠", color: "#eab308", text: "NGINX worker_processes set to 1 — recommend auto" },
            { icon: "✕", color: "#ef4444", text: "Missing ssl_certificate directive in server block" },
            { icon: "✓", color: "#22c55e", text: "Gzip compression enabled" },
            { icon: "✓", color: "#22c55e", text: "Security headers correctly configured" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: item.color, flexShrink: 0, lineHeight: 1.4 }}>{item.icon}</span>
              <span style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3fffa2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
    title: "Server Commands",
    desc: "Run predefined or custom commands with safety levels and sudo support.",
    color: "#3fffa2",
    preview: (
      <div style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", fontSize: 11 }}>
        <div style={{ background: "rgba(63,255,162,0.04)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "8px 14px", color: "rgba(255,255,255,0.4)", fontSize: 10 }}>Server Commands</div>
        {[
          { name: "Restart NGINX", badge: "SAFE", bc: "#22c55e" },
          { name: "Reload systemd", badge: "SUDO", bc: "#eab308" },
          { name: "View error logs", badge: "SAFE", bc: "#22c55e" },
          { name: "Flush iptables", badge: "DANGER", bc: "#ef4444" },
        ].map((cmd) => (
          <div key={cmd.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>{cmd.name}</span>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: `${cmd.bc}14`, color: cmd.bc, fontWeight: 700, letterSpacing: "0.06em" }}>{cmd.badge}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>,
    title: "File Management",
    desc: "Browse, create, rename, and delete files with a familiar tree interface.",
    color: "#4f8ef7",
    preview: (
      <div style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", fontSize: 11, fontFamily: "var(--font-mono)" }}>
        <div style={{ background: "rgba(79,142,247,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "8px 14px", color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Explorer</div>
        {[
          { indent: 0, type: "dir", name: "src", open: true },
          { indent: 1, type: "dir", name: "components", open: false },
          { indent: 1, type: "file", name: "index.js", active: true },
          { indent: 1, type: "file", name: "config.yml" },
          { indent: 0, type: "dir", name: "public", open: false },
          { indent: 0, type: "file", name: "package.json" },
        ].map((item: any, i) => (
          <div key={i} style={{ padding: `5px 14px 5px ${14 + item.indent * 14}px`, display: "flex", alignItems: "center", gap: 6, background: item.active ? "rgba(79,142,247,0.1)" : "transparent", borderLeft: item.active ? "2px solid #4f8ef7" : "2px solid transparent" }}>
            <span style={{ color: item.type === "dir" ? "#eab308" : item.active ? "#4f8ef7" : "rgba(255,255,255,0.4)", fontSize: 10 }}>
              {item.type === "dir" ? (item.open ? "▾" : "▸") : "◦"}
            </span>
            <span style={{ color: item.active ? "#fff" : "rgba(255,255,255,0.55)" }}>{item.name}</span>
          </div>
        ))}
      </div>
    ),
  },
];

const STATS = [
  { value: 99.9, suffix: "%", label: "Uptime SLA" },
  { value: 50, suffix: "ms", label: "Avg Latency" },
  { value: 6, suffix: "+", label: "Core Tools" },
  { value: 24, suffix: "/7", label: "Monitoring" },
];

// ── CTA helpers ──────────────────────────────────────────────────────────────
function TealPill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "14px 32px", borderRadius: 9999, fontWeight: 700, fontSize: 15,
      textDecoration: "none", background: "#3fffa2", color: "#0b1120",
      boxShadow: "0 4px 28px rgba(63,255,162,0.3)", transition: "all 0.2s",
    }}>
      {children}
    </Link>
  );
}

function GhostPill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "13px 28px", borderRadius: 9999, fontWeight: 600, fontSize: 15,
      textDecoration: "none", background: "rgba(255,255,255,0.04)",
      color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.1)",
      transition: "all 0.2s",
    }}>
      {children}
    </Link>
  );
}

const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

function HeroCTA() {
  const { data: session } = useSession();
  const isPro = (session as any)?.plan === "pro";
  if (!session) return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <TealPill href="/signup">Get Started Free <Arrow /></TealPill>
      <GhostPill href="/pricing">View Pricing</GhostPill>
    </div>
  );
  if (isPro) return (
    <div style={{ display: "flex", gap: 12 }}>
      <TealPill href="/dashboard">Go to Dashboard <Arrow /></TealPill>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <TealPill href="/pricing">Upgrade to Pro <Arrow /></TealPill>
      <GhostPill href="/dashboard">Dashboard</GhostPill>
    </div>
  );
}

function BottomCTA() {
  const { data: session } = useSession();
  const isPro = (session as any)?.plan === "pro";
  const href = !session ? "/signup" : isPro ? "/dashboard" : "/pricing";
  const label = !session ? "Get Started Free" : isPro ? "Go to Dashboard" : "Upgrade to Pro";
  return <TealPill href={href}>{label} <Arrow /></TealPill>;
}

// ── IDE Mockup ───────────────────────────────────────────────────────────────
function IdeMockup({ compact }: { compact?: boolean }) {
  const fs = compact ? 11 : 13;
  const lnW = compact ? 22 : 28;
  return (
    <div style={s.mockup}>
      <div style={s.mockupBar}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#ff5f56","#ffbd2e","#27c93f"].map(c => (
            <span key={c} style={{ width: compact ? 10 : 12, height: compact ? 10 : 12, borderRadius: "50%", background: c, display: "inline-block" }} />
          ))}
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: compact ? 11 : 12, color: "rgba(255,255,255,0.3)" }}>Vela — server01</span>
        <div style={{ width: compact ? 40 : 52 }} />
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ ...s.mockupSidebar, ...(compact ? { width: 120 } : {}) }}>
          {[["index.js", true], ["package.json", false], ["config.yml", false], [".env", false]].map(([name, active]) => (
            <div key={name as string} style={{ ...s.mockupFile, ...(active ? s.mockupFileActive : {}), fontSize: fs }}>{name as string}</div>
          ))}
        </div>
        <div style={{ ...s.mockupEditor, fontSize: fs }}>
          <div style={s.cLine}><span style={{ ...s.ln, width: lnW }}>1</span><span style={s.kw}>const</span><span style={s.wh}> express = </span><span style={s.fn}>require</span><span style={s.st}>(&#39;express&#39;)</span><span style={s.wh}>;</span></div>
          <div style={s.cLine}><span style={{ ...s.ln, width: lnW }}>2</span><span style={s.kw}>const</span><span style={s.wh}> app = </span><span style={s.fn}>express</span><span style={s.wh}>();</span></div>
          <div style={s.cLine}><span style={{ ...s.ln, width: lnW }}>3</span></div>
          <div style={s.cLine}><span style={{ ...s.ln, width: lnW }}>4</span><span style={s.wh}>app.</span><span style={s.fn}>get</span><span style={s.wh}>(</span><span style={s.st}>&#39;/&#39;</span><span style={s.wh}>, (req, res) =&gt; {"{"}</span></div>
          <div style={s.cLine}><span style={{ ...s.ln, width: lnW }}>5</span><span style={s.wh}>  res.</span><span style={s.fn}>json</span><span style={s.wh}>({"{"} </span><span style={s.ky}>status</span><span style={s.wh}>: </span><span style={s.st}>&#39;running&#39;</span><span style={s.wh}> {"}"});</span></div>
          <div style={s.cLine}><span style={{ ...s.ln, width: lnW }}>6</span><span style={s.wh}>{"})"}</span><span style={s.wh}>;</span></div>
          <div style={s.cLine}><span style={{ ...s.ln, width: lnW }}>7</span></div>
          <div style={s.cLine}><span style={{ ...s.ln, width: lnW }}>8</span><span style={s.wh}>app.</span><span style={s.fn}>listen</span><span style={s.wh}>(</span><span style={s.nm}>3000</span><span style={s.wh}>);</span></div>
        </div>
      </div>
      <div style={{ ...s.mockupTerminal, fontSize: fs }}>
        <span style={{ color: "#3fffa2", marginRight: 8 }}>$</span> node index.js
        <br /><span style={{ color: "#22c55e" }}>Server listening on port 3000</span>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: "#0b1120" }}>

      {/* ══════════════════════════════════════════════════ */}
      {/* 1 · HERO — dark navy, sweeping wave, white title  */}
      {/* ══════════════════════════════════════════════════ */}
      <section style={s.hero}>
        {/* Sweeping gradient wave */}
        <div style={s.heroWave} aria-hidden />
        {/* Glowing particle field */}
        <div style={s.particles} aria-hidden>
          {DOTS.map((d, i) => (
            <span key={i} style={{ position: "absolute", left: d.left, top: d.top, width: d.size, height: d.size, borderRadius: "50%", background: d.color, opacity: d.opacity }} />
          ))}
        </div>
        <div style={s.heroInner}>
          <div style={s.heroBadge}>
            <span style={s.heroBadgeDot} />
            Browser-based IDE for Linux VMs
          </div>
          <h1 style={s.heroTitle}>
            Where developers<br />are doing their<br />best work.
          </h1>
          <p style={s.heroSub}>
            A full VS Code-like IDE in your browser. Connect to any Linux VM over SSH —
            edit files, run commands, deploy, and monitor with AI-powered insights.
          </p>
          <HeroCTA />
        </div>
        {/* IDE mockup */}
        <div style={s.heroMockupWrap}>
          <div style={s.heroMockupGlow} aria-hidden />
          <IdeMockup />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* 2 · TOOL STRIP — slightly lighter navy surface    */}
      {/* ══════════════════════════════════════════════════ */}
      <section style={s.toolSection}>
        <div style={s.toolInner}>
          <p style={s.toolLabel}>Explore the features</p>
          <div style={s.toolRow}>
            {TOOLS.map((t, i) => (
              <div key={i} style={s.toolCircle} title={t.label}>
                {t.icon}
              </div>
            ))}
          </div>
          <p style={s.toolDesc}>
            Vela is our developer-first infrastructure management platform,
            evolving the browser IDE into the cloud-native era — connect directly to
            any Linux VM with no agents, no config, no friction.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* 3 · FEATURE HEADING + GRID — dark cards           */}
      {/* ══════════════════════════════════════════════════ */}
      <section style={s.featureSection}>
        <div style={s.sectionInner}>
          <h2 style={s.centeredTitle}>One IDE.<br />Unlimited superpowers.</h2>
          <p style={s.centeredSub}>
            Everything you need to manage Linux VMs — editor, terminal, deploy, and AI — in one browser tab.
          </p>
          <div style={s.featureGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} style={s.featureCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ ...s.featureIcon, background: `${f.color}10`, border: `1px solid ${f.color}22` }}>
                    {f.icon}
                  </div>
                  <h3 style={s.featureTitle}>{f.title}</h3>
                </div>
                <p style={s.featureDesc}>{f.desc}</p>
                <div style={{ marginTop: 18 }}>{f.preview}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* 4 · TWO-COL: Editor detail                        */}
      {/* ══════════════════════════════════════════════════ */}
      <section style={s.twoColSection}>
        <div style={s.twoColWrap}>
          <div style={s.twoColText}>
            <h2 style={s.twoColTitle}>An IDE Core<br />built for the cloud</h2>
            <p style={s.twoColDesc}>
              Vela's Editor view offers tab autocompletion, syntax highlighting for 50+ languages,
              natural language file commands, and a configurable context-aware file tree —
              all talking directly to your remote VM over SSH.
            </p>
            <div style={{ marginTop: 36 }}>
              <TealPill href="/signup">Try the Editor <Arrow /></TealPill>
            </div>
          </div>
          <div style={s.twoColVisual}>
            <div style={{ ...s.visualGlow, background: "radial-gradient(ellipse at 50% 40%, rgba(63,255,162,0.12) 0%, rgba(79,142,247,0.08) 50%, transparent 70%)" }} aria-hidden />
            <IdeMockup compact />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* 5 · TWO-COL: Deploy detail (flipped)              */}
      {/* ══════════════════════════════════════════════════ */}
      <section style={{ ...s.twoColSection, background: "#0d1528" }}>
        <div style={{ ...s.twoColWrap, flexDirection: "row-reverse" as const }}>
          <div style={s.twoColText}>
            <h2 style={s.twoColTitle}>Cross-surface<br />Deploy & Control</h2>
            <p style={s.twoColDesc}>
              Push changes to production with pre-validation, automatic backup, and instant rollback.
              Run server commands with safety levels, sudo support, and real-time output streaming
              direct from your VM.
            </p>
            <div style={{ marginTop: 36 }}>
              <TealPill href="/pricing">Explore Deploy <Arrow /></TealPill>
            </div>
          </div>
          <div style={s.twoColVisual}>
            <div style={{ ...s.visualGlow, background: "radial-gradient(ellipse at 50% 50%, rgba(79,142,247,0.14) 0%, rgba(167,139,250,0.08) 55%, transparent 75%)" }} aria-hidden />
            <div style={s.mockup}>
              <div style={s.mockupBar}>
                <div style={{ display: "flex", gap: 6 }}>
                  {["#ff5f56","#ffbd2e","#27c93f"].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />)}
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>terminal</span>
                <div style={{ width: 40 }} />
              </div>
              <div style={{ padding: "16px 20px", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.9 }}>
                <div><span style={{ color: "#3fffa2" }}>$</span><span style={{ color: "rgba(255,255,255,0.75)", marginLeft: 10 }}>git add . && git commit -m "fix auth"</span></div>
                <div><span style={{ color: "rgba(255,255,255,0.3)" }}>[main 3a4f2c1] fix auth</span></div>
                <div style={{ marginTop: 6 }}><span style={{ color: "#3fffa2" }}>$</span><span style={{ color: "rgba(255,255,255,0.75)", marginLeft: 10 }}>npm run deploy</span></div>
                <div><span style={{ color: "#4f8ef7" }}>→</span><span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>Validating build...</span></div>
                <div><span style={{ color: "#4f8ef7" }}>→</span><span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>Backup created: v1.2.3</span></div>
                <div><span style={{ color: "#22c55e" }}>✓</span><span style={{ color: "#22c55e", marginLeft: 8 }}>Deployed to production</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* 6 · STATS + CTA                                   */}
      {/* ══════════════════════════════════════════════════ */}
      <section style={s.ctaSection}>
        <div style={s.heroWave} aria-hidden />
        <div style={s.ctaInner}>
          <div style={s.statsGrid}>
            {STATS.map((stat, i) => (
              <div key={i} style={s.statItem}>
                <div style={s.statValue}>
                  <CountUp to={stat.value} duration={2.5} separator="," />
                  <span>{stat.suffix}</span>
                </div>
                <div style={s.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
          <div style={s.ctaBlock}>
            <h2 style={s.centeredTitle}>Ready to streamline<br />your workflow?</h2>
            <p style={{ ...s.centeredSub, marginBottom: 40 }}>
              Start with the free plan. Upgrade anytime for Pro features.
            </p>
            <BottomCTA />
          </div>
        </div>
      </section>

    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {

  // Hero
  hero: {
    position: "relative",
    background: "#0b1120",
    padding: "110px 24px 80px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflow: "hidden",
  },
  heroWave: {
    position: "absolute",
    top: 0,
    left: "-20%",
    right: "-20%",
    height: "65%",
    background: "linear-gradient(160deg, rgba(63,255,162,0.07) 0%, rgba(79,142,247,0.11) 35%, rgba(167,139,250,0.08) 65%, rgba(252,169,141,0.04) 100%)",
    borderRadius: "0 0 60% 60%",
    filter: "blur(70px)",
    pointerEvents: "none",
  },
  particles: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  heroInner: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 28,
    maxWidth: 700,
    width: "100%",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 16px",
    borderRadius: 9999,
    border: "1px solid rgba(63,255,162,0.2)",
    background: "rgba(63,255,162,0.05)",
    fontSize: 13,
    fontWeight: 500,
    color: "#3fffa2",
    letterSpacing: "0.02em",
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#3fffa2",
    display: "inline-block",
    boxShadow: "0 0 6px rgba(63,255,162,0.8)",
  },
  heroTitle: {
    fontSize: "clamp(44px, 6.5vw, 76px)",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.04em",
    lineHeight: 1.08,
    margin: 0,
  },
  heroSub: {
    fontSize: 18,
    lineHeight: 1.7,
    color: "#8fa3c8",
    maxWidth: 540,
    margin: 0,
  },
  heroMockupWrap: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 860,
    marginTop: 72,
  },
  heroMockupGlow: {
    position: "absolute",
    inset: -60,
    background: "radial-gradient(ellipse at 50% 50%, rgba(63,255,162,0.06) 0%, rgba(79,142,247,0.06) 50%, transparent 70%)",
    pointerEvents: "none",
    filter: "blur(30px)",
  },

  // Tool strip
  toolSection: {
    background: "#0d1528",
    borderTop: "1px solid rgba(255,255,255,0.04)",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    padding: "80px 24px",
  },
  toolInner: {
    maxWidth: 1000,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  toolLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "#3fffa2",
    marginBottom: 28,
  },
  toolRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap" as const,
  },
  toolCircle: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "default",
    flexShrink: 0,
  },
  toolDesc: {
    marginTop: 52,
    fontSize: "clamp(18px, 2.5vw, 24px)",
    fontWeight: 400,
    color: "#c5d5ee",
    lineHeight: 1.6,
    maxWidth: 640,
  },

  // Feature section
  featureSection: {
    background: "#0b1120",
    padding: "120px 24px",
  },
  sectionInner: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  centeredTitle: {
    fontSize: "clamp(38px, 5.5vw, 68px)",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.04em",
    lineHeight: 1.1,
    textAlign: "center" as const,
    margin: "0 0 20px",
  },
  centeredSub: {
    fontSize: 18,
    color: "#8fa3c8",
    textAlign: "center" as const,
    maxWidth: 520,
    margin: "0 auto 64px",
    lineHeight: 1.65,
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  featureCard: {
    background: "#0f1829",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "24px 22px",
    display: "flex",
    flexDirection: "column" as const,
    transition: "border-color 0.2s",
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.01em",
    margin: 0,
  },
  featureDesc: {
    fontSize: 12.5,
    lineHeight: 1.65,
    color: "#4a6490",
    margin: 0,
  },

  // Two-column sections
  twoColSection: {
    background: "#0b1120",
    padding: "100px 24px",
  },
  twoColWrap: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 80,
  },
  twoColText: {
    flex: "0 0 400px",
  },
  twoColTitle: {
    fontSize: "clamp(28px, 3.5vw, 46px)",
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    margin: "0 0 16px",
  },
  twoColDesc: {
    fontSize: 16,
    lineHeight: 1.75,
    color: "#8fa3c8",
    margin: 0,
  },
  twoColVisual: {
    flex: 1,
    position: "relative",
    minWidth: 0,
  },
  visualGlow: {
    position: "absolute",
    inset: -50,
    pointerEvents: "none",
    filter: "blur(40px)",
  },

  // CTA / Stats section
  ctaSection: {
    position: "relative",
    background: "#0d1528",
    padding: "120px 24px",
    overflow: "hidden",
  },
  ctaInner: {
    position: "relative",
    zIndex: 1,
    maxWidth: 900,
    margin: "0 auto",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 0,
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    overflow: "hidden",
  },
  statItem: {
    padding: "32px 24px",
    textAlign: "center" as const,
    borderRight: "1px solid rgba(255,255,255,0.06)",
  },
  statValue: {
    fontSize: "clamp(30px, 4vw, 48px)",
    fontWeight: 800,
    color: "#3fffa2",
    letterSpacing: "-0.04em",
    lineHeight: 1,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 11,
    color: "#4a6490",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    fontWeight: 600,
  },
  ctaBlock: {
    marginTop: 96,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    textAlign: "center" as const,
  },

  // Mockup chrome
  mockup: {
    position: "relative",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.07)",
    overflow: "hidden",
    background: "rgba(11,17,32,0.98)",
    boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(63,255,162,0.03)",
  },
  mockupBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "11px 16px",
    background: "rgba(255,255,255,0.02)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  mockupSidebar: {
    width: 150,
    padding: "12px 0",
    borderRight: "1px solid rgba(255,255,255,0.04)",
    background: "rgba(255,255,255,0.01)",
  },
  mockupFile: {
    padding: "5px 16px",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    color: "var(--text-secondary)",
  },
  mockupFileActive: {
    color: "var(--text-bright)",
    background: "rgba(63,255,162,0.08)",
    borderLeft: "2px solid #3fffa2",
  },
  mockupEditor: {
    flex: 1,
    padding: "14px 0",
    fontFamily: "var(--font-mono)",
    lineHeight: 1.7,
  },
  mockupTerminal: {
    padding: "11px 16px",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    lineHeight: 1.6,
    color: "var(--text-secondary)",
    background: "rgba(0,0,0,0.25)",
    borderTop: "1px solid rgba(255,255,255,0.04)",
  },

  // Code tokens
  cLine: { padding: "0 16px", whiteSpace: "nowrap" as const },
  ln: { display: "inline-block", width: 28, color: "rgba(255,255,255,0.18)", textAlign: "right" as const, marginRight: 16, userSelect: "none" as const },
  kw: { color: "#a78bfa" },
  fn: { color: "#67e8f9" },
  st: { color: "#86efac" },
  nm: { color: "#fbbf24" },
  ky: { color: "#93c5fd" },
  wh: { color: "rgba(255,255,255,0.75)" },
};
