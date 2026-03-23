"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/lib/ThemeContext";

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function NavBar() {
  const { data: session } = useSession();
  const { D, isDark, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  const plan = (session as any)?.plan || "free";
  const isPro = plan === "pro" || plan === "max" || plan === "premium" || plan === "enterprise" || plan === "ai-pro";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      height: 56,
      background: scrolled
        ? (isDark ? "rgba(13,17,23,0.92)" : "rgba(249,249,255,0.92)")
        : D.surfaceContainerLow,
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: `1px solid ${D.outlineVariant}`,
      transition: "background 0.2s",
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 24px",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link href={session ? "/dashboard" : "/"} style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <span style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: D.inverseSurface,
          }}>Vinexus</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {session ? (
            <>
              <NavLink href="/dashboard" color={D.onSurfaceVariant}>Home</NavLink>
              <NavLink href="/#features" color={D.onSurfaceVariant}>Features</NavLink>
              <NavLink href="/pricing" color={D.onSurfaceVariant}>Pricing</NavLink>
              <NavLink href="/docs" color={D.onSurfaceVariant}>Docs</NavLink>
              <NavLink href="/account" color={D.onSurfaceVariant}>Account</NavLink>
              {(session as any).role === "admin" && (
                <NavLink href="/admin" color="#eab308">Admin</NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink href="/#features" color={D.onSurfaceVariant}>Features</NavLink>
              <NavLink href="/pricing" color={D.onSurfaceVariant}>Pricing</NavLink>
              <NavLink href="/docs" color={D.onSurfaceVariant}>Docs</NavLink>
            </>
          )}
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: 30, height: 30, borderRadius: 6,
              border: `1px solid ${D.outlineVariant}`,
              background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: D.onSurfaceVariant, fontFamily: "inherit",
            }}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {session ? (
            <>
              {!isPro && (
                <Link href="/pricing" style={{
                  padding: "6px 14px", borderRadius: 9999,
                  background: `${D.primary}20`, border: `1px solid ${D.primary}50`,
                  color: D.primary, fontSize: 13, fontWeight: 600, textDecoration: "none",
                }}>
                  Upgrade
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{
                  padding: "6px 16px",
                  background: "transparent",
                  color: D.onSurfaceVariant,
                  border: `1px solid ${D.outlineVariant}`,
                  borderRadius: 9999,
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{
                padding: "6px 16px", borderRadius: 9999,
                color: D.onSurfaceVariant, fontSize: 13, fontWeight: 500,
                textDecoration: "none", border: `1px solid ${D.outlineVariant}`,
              }}>
                Sign In
              </Link>
              <Link href="/download" style={{
                padding: "6px 16px", borderRadius: 9999,
                background: D.primary, color: "#ffffff",
                fontSize: 13, fontWeight: 700, textDecoration: "none",
              }}>
                Download
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children, color }: { href: string; children: React.ReactNode; color?: string }) {
  return (
    <Link href={href} style={{
      padding: "7px 14px", fontSize: 14, fontWeight: 500,
      color: color ?? "#8fa3c8", textDecoration: "none",
      borderRadius: 8, transition: "color 0.15s",
    }}>
      {children}
    </Link>
  );
}
