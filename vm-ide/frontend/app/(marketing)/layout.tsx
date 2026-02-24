"use client";
import NavBar from "@/components/NavBar";
import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="noise" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar />
      <main style={{ flex: 1 }}>{children}</main>
      <footer style={footerStyles.footer}>
        <div style={footerStyles.inner}>
          <div style={footerStyles.grid}>
            {/* Brand */}
            <div style={footerStyles.brand}>
              <div style={footerStyles.logoRow}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                <span style={footerStyles.logoText}>InfraNexus</span>
              </div>
              <p style={footerStyles.brandDesc}>
                Browser-based IDE for managing Linux virtual machines. Edit, deploy, and monitor from anywhere.
              </p>
            </div>

            {/* Product */}
            <div style={footerStyles.col}>
              <h4 style={footerStyles.colTitle}>Product</h4>
              <a href="/pricing" style={footerStyles.colLink}>Pricing</a>
              <a href="/signup" style={footerStyles.colLink}>Get Started</a>
              <a href="/login" style={footerStyles.colLink}>Sign In</a>
            </div>

            {/* Features */}
            <div style={footerStyles.col}>
              <h4 style={footerStyles.colTitle}>Features</h4>
              <span style={footerStyles.colLink}>Monaco Editor</span>
              <span style={footerStyles.colLink}>SSH Terminal</span>
              <span style={footerStyles.colLink}>AI Insights</span>
            </div>

            {/* Legal */}
            <div style={footerStyles.col}>
              <h4 style={footerStyles.colTitle}>Company</h4>
              <Link href="/privacy" style={footerStyles.colLink}>Privacy</Link>
              <Link href="/terms" style={footerStyles.colLink}>Terms</Link>
              <Link href="/contact" style={footerStyles.colLink}>Contact</Link>
            </div>
          </div>

          <div style={footerStyles.bottom}>
            <span>&copy; {new Date().getFullYear()} InfraNexus. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const footerStyles: Record<string, React.CSSProperties> = {
  footer: {
    borderTop: "1px solid rgba(255,255,255,0.04)",
    background: "rgba(9, 9, 11, 0.8)",
    padding: "64px 0 0",
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
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    color: "var(--text-bright)",
  },
  brandDesc: {
    fontSize: 13,
    color: "var(--text-secondary)",
    lineHeight: 1.7,
    maxWidth: 280,
  },
  col: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  colTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-bright)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: 4,
  },
  colLink: {
    fontSize: 13,
    color: "var(--text-secondary)",
    textDecoration: "none",
    transition: "color 0.15s",
    cursor: "pointer",
  },
  bottom: {
    borderTop: "1px solid rgba(255,255,255,0.04)",
    padding: "24px 0",
    fontSize: 12,
    color: "var(--text-muted)",
  },
};
