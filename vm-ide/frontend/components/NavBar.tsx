"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/lib/ThemeContext";

export default function NavBar() {
  const { D, isDark, toggle } = useTheme();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);

  const role = (session as any)?.role;
  const isOwner = role === "owner";

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
      background: scrolled
        ? (isDark ? "rgba(13,17,23,0.92)" : "rgba(249,249,255,0.92)")
        : "transparent",
      backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
      borderBottom: scrolled ? `1px solid ${D.outlineVariant}` : "1px solid transparent",
      transition: "all 0.25s ease",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `${D.primary}18`,
            border: `1px solid ${D.primary}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={D.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: D.inverseSurface, letterSpacing: "-0.03em" }}>Vinexus</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {session ? (
            <>
              <Link href="/dashboard" style={{ color: D.onSurfaceVariant, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Dashboard</Link>
              <Link href="/app" style={{ color: D.onSurfaceVariant, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>IDE</Link>
              <Link href="/account" style={{ color: D.onSurfaceVariant, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Account</Link>
              {isOwner && (
                <Link href="/admin" style={{ color: "#eab308", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Admin</Link>
              )}
              <button
                onClick={toggle}
                style={{ background: "none", border: `1px solid ${D.outlineVariant}`, borderRadius: 8, cursor: "pointer", padding: "6px 8px", color: D.onSurfaceVariant, display: "flex", alignItems: "center" }}
              >
                {isDark ? "☀" : "☾"}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{ padding: "7px 16px", background: "transparent", color: D.onSurfaceVariant, border: `1px solid ${D.outlineVariant}`, borderRadius: 9999, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/pricing" style={{ color: D.onSurfaceVariant, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Pricing</Link>
              <Link href="/docs" style={{ color: D.onSurfaceVariant, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Docs</Link>
              <Link href="/download" style={{ color: D.onSurfaceVariant, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Download</Link>
              <button
                onClick={toggle}
                style={{ background: "none", border: `1px solid ${D.outlineVariant}`, borderRadius: 8, cursor: "pointer", padding: "6px 8px", color: D.onSurfaceVariant, display: "flex", alignItems: "center" }}
              >
                {isDark ? "☀" : "☾"}
              </button>
              <Link href="/login" style={{ color: D.onSurfaceVariant, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Sign In</Link>
              <Link href="/signup" style={{
                display: "inline-flex", alignItems: "center",
                padding: "8px 20px", borderRadius: 9999,
                background: D.primary, color: "#fff",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
              }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
