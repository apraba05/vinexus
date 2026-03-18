"use client";
import NavBar from "@/components/NavBar";
import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0b1120" }}>
      <NavBar />
      <main style={{ flex: 1 }}>{children}</main>
      <footer style={f.footer}>
        <div style={f.inner}>
          <div style={f.grid}>
            {/* Brand */}
            <div style={f.brand}>
              <div style={f.logoRow}>
                <div style={f.logoMark}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3fffa2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <span style={f.logoText}>InfraNexus</span>
              </div>
              <p style={f.brandDesc}>
                Browser-based IDE for managing Linux virtual machines. Edit, deploy, and monitor from anywhere.
              </p>
            </div>

            {/* Product */}
            <div style={f.col}>
              <h4 style={f.colTitle}>Product</h4>
              <a href="/pricing" style={f.colLink}>Pricing</a>
              <a href="/signup" style={f.colLink}>Get Started</a>
              <a href="/login" style={f.colLink}>Sign In</a>
            </div>

            {/* Features */}
            <div style={f.col}>
              <h4 style={f.colTitle}>Features</h4>
              <span style={f.colText}>Monaco Editor</span>
              <span style={f.colText}>SSH Terminal</span>
              <span style={f.colText}>AI Insights</span>
            </div>

            {/* Company */}
            <div style={f.col}>
              <h4 style={f.colTitle}>Company</h4>
              <Link href="/privacy" style={f.colLink}>Privacy</Link>
              <Link href="/terms" style={f.colLink}>Terms</Link>
              <Link href="/contact" style={f.colLink}>Contact</Link>
            </div>
          </div>

          <div style={f.bottom}>
            <span>&copy; {new Date().getFullYear()} InfraNexus. All rights reserved.</span>
          </div>
        </div>

        {/* Large display wordmark — Antigravity-inspired */}
        <div style={f.wordmark} aria-hidden>InfraNexus</div>
      </footer>
    </div>
  );
}

const f: Record<string, React.CSSProperties> = {
  footer: {
    background: "#0b1120",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    padding: "64px 0 0",
    overflow: "hidden",
  },
  inner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
    gap: 48,
    paddingBottom: 48,
  },
  brand: {},
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 7,
    background: "rgba(63,255,162,0.07)",
    border: "1px solid rgba(63,255,162,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 15,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.02em",
  },
  brandDesc: {
    fontSize: 13,
    color: "#4a6490",
    lineHeight: 1.7,
    maxWidth: 280,
    margin: 0,
  },
  col: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  colTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#8fa3c8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    margin: "0 0 4px",
  },
  colLink: {
    fontSize: 13,
    color: "#4a6490",
    textDecoration: "none",
    transition: "color 0.15s",
    cursor: "pointer",
  },
  colText: {
    fontSize: 13,
    color: "#4a6490",
  },
  bottom: {
    borderTop: "1px solid rgba(255,255,255,0.05)",
    padding: "20px 0",
    fontSize: 12,
    color: "#2a3d5a",
  },
  wordmark: {
    fontSize: "clamp(60px, 13vw, 148px)",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    color: "transparent",
    WebkitTextStroke: "1px rgba(255,255,255,0.05)",
    textAlign: "center" as const,
    lineHeight: 0.9,
    userSelect: "none" as const,
    pointerEvents: "none" as const,
  },
};
