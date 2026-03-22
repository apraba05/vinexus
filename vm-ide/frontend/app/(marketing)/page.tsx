"use client";
import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTheme } from "@/lib/ThemeContext";

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
      </svg>
    ),
    title: "Monaco Code Editor",
    desc: "Full VS Code editor power right in your browser. Syntax highlighting, IntelliSense, and multi-tab editing for any language.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
    title: "Integrated SSH Terminal",
    desc: "Direct SSH terminal access to your VMs. Run commands, manage processes, and debug in real-time.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </svg>
    ),
    title: "One-Click Deploy",
    desc: "Deploy your code to any server instantly. Automate your workflow and ship faster than ever before.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    title: "AI-Powered Insights",
    desc: "Analyze your code with Claude AI. Get instant explanations, bug detection, and improvement suggestions.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "File Management",
    desc: "Browse, create, rename, and delete files directly on your remote server. Full directory tree at your fingertips.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: "Desktop App",
    desc: "Native desktop app for macOS, Windows, and Linux. All the power of Vinexus with a native experience.",
  },
];

export default function LandingPage() {
  const { D, isDark } = useTheme();
  const { data: session } = useSession();

  return (
    <div style={{ background: D.surface }}>
      {/* Glow */}
      <div aria-hidden style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 900, height: 600,
        background: `radial-gradient(ellipse at 50% 0%, ${D.primary}10 0%, transparent 70%)`,
        filter: "blur(80px)", pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section style={{ maxWidth: 1160, margin: "0 auto", padding: "96px 24px 80px", textAlign: "center" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28,
            background: `${D.primary}10`, border: `1px solid ${D.primary}30`,
            borderRadius: 99, padding: "6px 16px",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: D.primary, display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: D.primary, letterSpacing: "0.04em" }}>
              Desktop IDE for Linux VMs
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900,
            color: D.inverseSurface, letterSpacing: "-0.04em", lineHeight: 1.05,
            margin: "0 0 24px",
          }}>
            Your VMs,<br />
            <span style={{ color: D.primary }}>fully under control.</span>
          </h1>

          <p style={{
            fontSize: "clamp(16px, 2vw, 20px)", color: D.onSurfaceVariant,
            maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.6,
          }}>
            Vinexus is a desktop IDE that connects to your Linux virtual machines over SSH.
            Edit code, run commands, and deploy — all from one app.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={session ? "/dashboard" : "/signup"} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 32px", borderRadius: 9999,
              background: D.primary, color: "#fff",
              fontSize: 16, fontWeight: 700, textDecoration: "none",
              boxShadow: `0 4px 24px ${D.primary}44`,
            }}>
              Get Started Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link href="/download" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", borderRadius: 9999,
              background: D.surfaceContainerHigh, color: D.onSurface,
              border: `1px solid ${D.outlineVariant}`,
              fontSize: 16, fontWeight: 600, textDecoration: "none",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download App
            </Link>
          </div>

          <p style={{ fontSize: 12, color: D.onSurfaceVariant, marginTop: 16, opacity: 0.7 }}>
            Free plan available · No credit card required
          </p>
        </section>

        {/* ── App Preview ──────────────────────────────────────── */}
        <section style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px 96px" }}>
          <div style={{
            borderRadius: 16, overflow: "hidden",
            border: `1px solid ${D.outlineVariant}`,
            boxShadow: `0 32px 80px ${isDark ? "rgba(0,0,0,0.5)" : "rgba(0,83,219,0.08)"}`,
          }}>
            {/* Title bar */}
            <div style={{ background: isDark ? D.surfaceContainerHigh : "#e8edf5", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${D.outlineVariant}` }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
              <span style={{ marginLeft: 8, fontSize: 12, color: D.onSurfaceVariant, fontWeight: 500 }}>Vinexus — ubuntu@192.168.1.100</span>
            </div>
            {/* IDE body */}
            <div style={{ display: "flex", height: 380, background: D.surfaceLowest }}>
              {/* Sidebar */}
              <div style={{ width: 200, background: D.surfaceContainerLow, borderRight: `1px solid ${D.outlineVariant}`, padding: "12px 0" }}>
                <div style={{ padding: "4px 16px", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: D.onSurfaceVariant }}>Explorer</span>
                </div>
                {["index.js", "package.json", "server.ts", ".env", "README.md"].map((f, i) => (
                  <div key={f} style={{ padding: "5px 16px", background: i === 0 ? D.surfaceContainerHigh : "transparent", display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={i === 0 ? D.primary : D.onSurfaceVariant} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
                    </svg>
                    <span style={{ fontSize: 12, color: i === 0 ? D.inverseSurface : D.onSurfaceVariant, fontFamily: "monospace" }}>{f}</span>
                  </div>
                ))}
              </div>
              {/* Editor */}
              <div style={{ flex: 1, background: isDark ? "#0d1117" : "#ffffff", padding: "16px 20px", fontFamily: "JetBrains Mono, monospace", fontSize: 13, lineHeight: 1.7, overflow: "hidden" }}>
                <div><span style={{ color: "#8b949e", marginRight: 16, userSelect: "none" }}>1</span><span style={{ color: isDark ? "#ff7b72" : "#b91c1c" }}>const</span><span style={{ color: isDark ? "#c9d1d9" : "#24292f" }}> express = </span><span style={{ color: isDark ? "#d2a8ff" : "#8250df" }}>require</span><span style={{ color: isDark ? "#a5d6ff" : "#0550ae" }}>(&#39;express&#39;)</span><span style={{ color: isDark ? "#c9d1d9" : "#24292f" }}>;</span></div>
                <div><span style={{ color: "#8b949e", marginRight: 16, userSelect: "none" }}>2</span><span style={{ color: isDark ? "#ff7b72" : "#b91c1c" }}>const</span><span style={{ color: isDark ? "#c9d1d9" : "#24292f" }}> app = </span><span style={{ color: isDark ? "#d2a8ff" : "#8250df" }}>express</span><span style={{ color: isDark ? "#c9d1d9" : "#24292f" }}>();</span></div>
                <div><span style={{ color: "#8b949e", marginRight: 16, userSelect: "none" }}>3</span></div>
                <div><span style={{ color: "#8b949e", marginRight: 16, userSelect: "none" }}>4</span><span style={{ color: isDark ? "#c9d1d9" : "#24292f" }}>app.</span><span style={{ color: isDark ? "#d2a8ff" : "#8250df" }}>get</span><span style={{ color: isDark ? "#c9d1d9" : "#24292f" }}>(</span><span style={{ color: isDark ? "#a5d6ff" : "#0550ae" }}>&#39;/&#39;</span><span style={{ color: isDark ? "#c9d1d9" : "#24292f" }}>, (req, res) =&gt; {"{"}</span></div>
                <div><span style={{ color: "#8b949e", marginRight: 16, userSelect: "none" }}>5</span><span style={{ color: isDark ? "#c9d1d9" : "#24292f" }}>  res.</span><span style={{ color: isDark ? "#d2a8ff" : "#8250df" }}>json</span><span style={{ color: isDark ? "#c9d1d9" : "#24292f" }}>({"{"} status: </span><span style={{ color: isDark ? "#a5d6ff" : "#0550ae" }}>&#39;ok&#39;</span><span style={{ color: isDark ? "#c9d1d9" : "#24292f" }}> {"}"});</span></div>
                <div><span style={{ color: "#8b949e", marginRight: 16, userSelect: "none" }}>6</span><span style={{ color: isDark ? "#c9d1d9" : "#24292f" }}>{"})"} ;</span></div>
                <div><span style={{ color: "#8b949e", marginRight: 16, userSelect: "none" }}>7</span></div>
                <div><span style={{ color: "#8b949e", marginRight: 16, userSelect: "none" }}>8</span><span style={{ color: isDark ? "#c9d1d9" : "#24292f" }}>app.</span><span style={{ color: isDark ? "#d2a8ff" : "#8250df" }}>listen</span><span style={{ color: isDark ? "#c9d1d9" : "#24292f" }}>(</span><span style={{ color: isDark ? "#ffa657" : "#953800" }}>3000</span><span style={{ color: isDark ? "#c9d1d9" : "#24292f" }}>);</span></div>
              </div>
              {/* Terminal */}
              <div style={{ width: 260, background: "#0d1117", borderLeft: `1px solid ${D.outlineVariant}`, padding: "12px 14px", fontFamily: "JetBrains Mono, monospace", fontSize: 12, lineHeight: 1.7 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Terminal</div>
                <div style={{ color: "#c9d1d9" }}><span style={{ color: "#3fb950" }}>ubuntu@vm</span><span style={{ color: "#79c0ff" }}>:~$</span> node index.js</div>
                <div style={{ color: "#3fb950" }}>Server running on :3000</div>
                <div style={{ color: "#c9d1d9", marginTop: 4 }}><span style={{ color: "#3fb950" }}>ubuntu@vm</span><span style={{ color: "#79c0ff" }}>:~$</span> <span style={{ animation: "blink 1s step-end infinite", display: "inline-block", width: 8, height: 14, background: "#c9d1d9", verticalAlign: "middle" }} /></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────── */}
        <section style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px 96px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: D.primary, marginBottom: 12 }}>Features</p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em", lineHeight: 1.1, margin: 0 }}>
              Everything you need to manage your VMs
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {FEATURES.map((feat) => (
              <div key={feat.title} style={{
                background: D.surfaceContainerLow,
                border: `1px solid ${D.outlineVariant}`,
                borderRadius: 16, padding: "24px 22px",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${D.primary}14`,
                  border: `1px solid ${D.primary}22`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16,
                  color: D.primary,
                }}>
                  {feat.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: D.inverseSurface, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{feat.title}</h3>
                <p style={{ fontSize: 13, color: D.onSurfaceVariant, lineHeight: 1.65, margin: 0 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px 120px" }}>
          <div style={{
            background: D.primaryContainer,
            border: `1px solid ${D.primary}30`,
            borderRadius: 24, padding: "64px 48px",
            textAlign: "center",
            boxShadow: `0 0 80px ${D.primary}12`,
          }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.04em", margin: "0 0 16px" }}>
              Ready to take control of your VMs?
            </h2>
            <p style={{ fontSize: 16, color: D.onSurfaceVariant, margin: "0 auto 36px", maxWidth: 480, lineHeight: 1.6 }}>
              Start for free. No credit card required. Download the desktop app or use the web version.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href={session ? "/dashboard" : "/signup"} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 32px", borderRadius: 9999,
                background: D.primary, color: "#fff",
                fontSize: 16, fontWeight: 700, textDecoration: "none",
                boxShadow: `0 4px 24px ${D.primary}44`,
              }}>
                Get Started Free
              </Link>
              <Link href="/pricing" style={{
                display: "inline-flex", alignItems: "center",
                padding: "14px 28px", borderRadius: 9999,
                background: D.surfaceLowest, color: D.onSurface,
                border: `1px solid ${D.outlineVariant}`,
                fontSize: 16, fontWeight: 600, textDecoration: "none",
              }}>
                View Pricing
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
