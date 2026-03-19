"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function NavBar() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);

  const plan = (session as any)?.plan || "free";
  const isPro = plan === "pro";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav style={{ ...styles.nav, ...(scrolled ? styles.navScrolled : {}) }}>
      <div style={styles.inner}>
        <Link href="/" style={styles.logo}>
          <div style={styles.logoMark}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3fffa2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <span style={styles.logoText}>Vela</span>
        </Link>

        <div style={styles.links}>
          {session ? (
            <>
              <Link href="/dashboard" className="nav-link" style={styles.link}>Dashboard</Link>
              <Link href="/app" className="nav-link" style={styles.link}>IDE</Link>
              <Link href="/docs" className="nav-link" style={styles.link}>Docs</Link>
              <Link href="/account" className="nav-link" style={styles.link}>Account</Link>
              {(session as any).role === "admin" && (
                <Link href="/admin" className="nav-link" style={{ ...styles.link, color: "#eab308" }}>Admin</Link>
              )}
              {!isPro && (
                <Link href="/pricing" style={styles.ctaBtn}>Upgrade to Pro</Link>
              )}
              <button style={styles.ghostBtn} onClick={() => signOut({ callbackUrl: "/" })}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/pricing" className="nav-link" style={styles.link}>Pricing</Link>
              <Link href="/login" className="nav-link" style={styles.link}>Sign In</Link>
              <Link href="/signup" style={styles.ctaBtn}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "transparent",
    borderBottom: "1px solid transparent",
    transition: "all 0.25s ease",
  },
  navScrolled: {
    background: "rgba(11, 17, 32, 0.92)",
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  inner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    textDecoration: "none",
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 9,
    background: "rgba(63,255,162,0.07)",
    border: "1px solid rgba(63,255,162,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.02em",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: 28,
  },
  link: {
    color: "#8fa3c8",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    transition: "color 0.15s",
  },
  ctaBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 20px",
    borderRadius: 9999,
    background: "#3fffa2",
    color: "#0b1120",
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    transition: "all 0.15s",
  },
  ghostBtn: {
    padding: "8px 18px",
    background: "transparent",
    color: "#8fa3c8",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 9999,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  },
};
