"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeProvider, useTheme } from "@/lib/ThemeContext";

const APP_URL = "https://app.vinexus.space";

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function Nav() {
  const { D, isDark, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100, height: 44,
      background: scrolled ? (isDark ? "rgba(13,17,23,0.92)" : "rgba(249,249,255,0.92)") : D.surfaceContainerLow,
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: `1px solid ${D.outlineVariant}`,
      transition: "background 0.2s",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", color: D.inverseSurface }}>Vinexus</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }}>
          {[
            { href: "/#features", label: "Features" },
            { href: "/pricing", label: "Pricing" },
            { href: "/docs", label: "Docs" },
          ].map((link) => (
            <Link key={link.href} href={link.href} style={{ padding: "5px 10px", fontSize: 13, fontWeight: 500, color: D.onSurfaceVariant, textDecoration: "none", borderRadius: 4 }}>
              {link.label}
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button onClick={toggle} style={{ width: 28, height: 28, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: D.onSurfaceVariant }} aria-label="Toggle theme">
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <a href={`${APP_URL}/login`} style={{ padding: "6px 14px", fontSize: 13, fontWeight: 500, color: D.onSurfaceVariant, textDecoration: "none", borderRadius: 4 }}>
            Sign In
          </a>
          <Link href="/download" style={{ padding: "6px 14px", fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none", background: D.primary, borderRadius: 4 }}>
            Download
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const { D } = useTheme();
  return (
    <footer style={{ background: D.surfaceContainerLow, borderTop: `1px solid ${D.outlineVariant}`, padding: "48px 20px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, paddingBottom: 40 }}>
          <div>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", color: D.inverseSurface }}>Vinexus</span>
            </Link>
            <p style={{ fontSize: 12, color: D.onSurfaceVariant, lineHeight: 1.7, maxWidth: 240, margin: 0 }}>
              A native desktop IDE that connects directly to your virtual machines via SSH.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: D.onSurface, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Product</span>
            {[{ href: "/#features", label: "Features" }, { href: "/pricing", label: "Pricing" }, { href: "/download", label: "Get Started" }].map((l) => (
              <Link key={l.href} href={l.href} style={{ fontSize: 12, color: D.onSurfaceVariant, textDecoration: "none" }}>{l.label}</Link>
            ))}
            <a href={`${APP_URL}/login`} style={{ fontSize: 12, color: D.onSurfaceVariant, textDecoration: "none" }}>Sign In</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: D.onSurface, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Docs</span>
            {[{ href: "/docs", label: "Getting Started" }, { href: "/docs#claude-integration", label: "Claude Integration" }, { href: "/docs#editor", label: "Editor Features" }].map((l) => (
              <Link key={l.href} href={l.href} style={{ fontSize: 12, color: D.onSurfaceVariant, textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: D.onSurface, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Company</span>
            {[{ href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }, { href: "/contact", label: "Contact" }].map((l) => (
              <Link key={l.href} href={l.href} style={{ fontSize: 12, color: D.onSurfaceVariant, textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${D.outlineVariant}`, paddingTop: 20, fontSize: 11, color: D.onSurfaceVariant }}>
          &copy; 2026 Vinexus. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function Inner({ children }: { children: React.ReactNode }) {
  const { D } = useTheme();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: D.surface, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Nav />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Inner>{children}</Inner>
    </ThemeProvider>
  );
}
