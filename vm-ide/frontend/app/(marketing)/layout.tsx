"use client";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import { useTheme } from "@/lib/ThemeContext";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { D } = useTheme();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: D.surface }}>
      <NavBar />
      <main style={{ flex: 1 }}>{children}</main>
      <footer style={{ background: D.surfaceContainerLow, borderTop: `1px solid ${D.outlineVariant}`, padding: "56px 0 0", overflow: "hidden" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, paddingBottom: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: `${D.primary}18`, border: `1px solid ${D.primary}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.03em" }}>Vinexus</span>
              </div>
              <p style={{ fontSize: 13, color: D.onSurfaceVariant, lineHeight: 1.7, maxWidth: 280, margin: 0 }}>
                Desktop IDE for managing Linux virtual machines. Edit, deploy, and monitor from anywhere.
              </p>
            </div>

            {/* Product */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: D.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Product</h4>
              <Link href="/pricing" style={{ fontSize: 13, color: D.onSurfaceVariant, textDecoration: "none" }}>Pricing</Link>
              <Link href="/download" style={{ fontSize: 13, color: D.onSurfaceVariant, textDecoration: "none" }}>Download</Link>
              <Link href="/signup" style={{ fontSize: 13, color: D.onSurfaceVariant, textDecoration: "none" }}>Get Started</Link>
              <Link href="/login" style={{ fontSize: 13, color: D.onSurfaceVariant, textDecoration: "none" }}>Sign In</Link>
            </div>

            {/* Features */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: D.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Features</h4>
              <span style={{ fontSize: 13, color: D.onSurfaceVariant }}>Monaco Editor</span>
              <span style={{ fontSize: 13, color: D.onSurfaceVariant }}>SSH Terminal</span>
              <span style={{ fontSize: 13, color: D.onSurfaceVariant }}>AI Insights</span>
              <span style={{ fontSize: 13, color: D.onSurfaceVariant }}>One-Click Deploy</span>
            </div>

            {/* Company */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: D.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Company</h4>
              <Link href="/privacy" style={{ fontSize: 13, color: D.onSurfaceVariant, textDecoration: "none" }}>Privacy</Link>
              <Link href="/terms" style={{ fontSize: 13, color: D.onSurfaceVariant, textDecoration: "none" }}>Terms</Link>
              <a href="mailto:support@vinexus.space" style={{ fontSize: 13, color: D.onSurfaceVariant, textDecoration: "none" }}>Contact</a>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${D.outlineVariant}`, padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: D.onSurfaceVariant }}>&copy; {new Date().getFullYear()} Vinexus. All rights reserved.</span>
            <span style={{ fontSize: 12, color: D.onSurfaceVariant }}>support@vinexus.space</span>
          </div>
        </div>

        {/* Wordmark */}
        <div aria-hidden style={{
          fontSize: "clamp(60px, 13vw, 148px)",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          color: "transparent",
          WebkitTextStroke: `1px ${D.outlineVariant}`,
          textAlign: "center",
          lineHeight: 0.9,
          userSelect: "none",
          pointerEvents: "none",
          paddingBottom: 8,
        }}>
          Vinexus
        </div>
      </footer>
    </div>
  );
}
