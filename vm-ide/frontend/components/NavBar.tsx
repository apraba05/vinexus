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
    <nav style={{
      ...styles.nav,
      ...(scrolled ? styles.navScrolled : {}),
    }}>
      <div style={styles.inner}>
        <Link href="/" style={styles.logo}>
          <div style={styles.logoMark}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <span style={styles.logoText}>InfraNexus</span>
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
                <Link
                  href="/pricing"
                  className="btn btn-primary btn-sm"
                  style={{ textDecoration: "none" }}
                >
                  Upgrade to Pro
                </Link>
              )}
              <button
                style={styles.logoutBtn}
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/pricing" className="nav-link" style={styles.link}>Pricing</Link>
              <Link href="/login" className="nav-link" style={styles.link}>Sign In</Link>
              <Link href="/signup" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
                Get Started
              </Link>
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
    transition: "all 0.3s ease",
  },
  navScrolled: {
    background: "rgba(9, 9, 11, 0.85)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  inner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    height: 72,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "rgba(6, 182, 212, 0.08)",
    border: "1px solid rgba(6, 182, 212, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 17,
    fontWeight: 700,
    color: "var(--text-bright)",
    letterSpacing: "-0.02em",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: 28,
  },
  link: {
    color: "var(--text-secondary)",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    transition: "color 0.2s",
  },
  logoutBtn: {
    padding: "8px 16px",
    background: "rgba(255,255,255,0.03)",
    color: "var(--text-secondary)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
};
