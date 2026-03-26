"use client";
/**
 * /desktop-callback
 *
 * Landing page after the user completes login on vinexus.space from the
 * Vinexus Desktop app. Flow:
 *
 *   1. Desktop opens browser → vinexus.space/login?desktop=1
 *   2. User logs in (email/password)
 *   3. Login page redirects here on success
 *   4. This page calls /api/auth/desktop-token to get a short-lived token
 *   5. Fires vinexus://auth/callback?token=...&origin=...
 *   6. Electron exchanges the token, stores the user, and opens the IDE
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DesktopCallbackPage() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "redirecting" | "open" | "error">("loading");
  const [deepLink, setDeepLink] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function completeDesktopSignIn() {
      try {
        // Verify the user is actually logged in
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (!meData?.user) {
          router.replace("/login?desktop=1");
          return;
        }

        // Request a one-time desktop auth token
        const tokenRes = await fetch("/api/auth/desktop-token", { method: "POST" });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData?.token) {
          throw new Error(tokenData?.error || "Failed to create desktop sign-in token");
        }

        const link =
          `vinexus://auth/callback` +
          `?token=${encodeURIComponent(tokenData.token)}` +
          `&origin=${encodeURIComponent(window.location.origin)}`;

        if (!cancelled) {
          setDeepLink(link);
          setState("redirecting");
          window.location.href = link;
          // Show manual button after a short delay in case the OS prompt is dismissed
          setTimeout(() => {
            if (!cancelled) setState("open");
          }, 2500);
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err.message || "Sign-in failed. Please try again.");
          setState("error");
        }
      }
    }

    completeDesktopSignIn();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "#0a0a12",
      color: "#fff",
      fontFamily: "system-ui, -apple-system, sans-serif",
      gap: 20,
      padding: "0 24px",
      textAlign: "center",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Logo mark */}
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, fontWeight: 800, color: "#fff",
        marginBottom: 8,
      }}>V</div>

      {state === "loading" && (
        <>
          <div style={{
            width: 28, height: 28,
            border: "2px solid rgba(255,255,255,0.12)",
            borderTopColor: "#A78BFA",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "rgba(255,255,255,0.55)", margin: 0, fontSize: 14 }}>
            Completing sign-in…
          </p>
        </>
      )}

      {state === "redirecting" && (
        <>
          <div style={{
            width: 28, height: 28,
            border: "2px solid rgba(255,255,255,0.12)",
            borderTopColor: "#A78BFA",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "rgba(255,255,255,0.85)", margin: 0, fontSize: 16, fontWeight: 600 }}>
            Returning to Vinexus…
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: 13 }}>
            Allow the browser prompt to open the desktop app.
          </p>
        </>
      )}

      {state === "open" && (
        <>
          <p style={{ color: "rgba(255,255,255,0.85)", margin: 0, fontSize: 16, fontWeight: 600 }}>
            Didn't open automatically?
          </p>
          <a
            href={deepLink}
            style={{
              display: "inline-block",
              padding: "10px 24px",
              borderRadius: 8,
              background: "#7C3AED",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Open Vinexus Desktop
          </a>
          <p style={{ color: "rgba(255,255,255,0.3)", margin: 0, fontSize: 12 }}>
            You can close this tab after the app opens.
          </p>
        </>
      )}

      {state === "error" && (
        <>
          <p style={{ color: "#f87171", margin: 0, fontSize: 14 }}>{errorMsg}</p>
          <a
            href="/login?desktop=1"
            style={{
              display: "inline-block",
              padding: "9px 20px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Try again
          </a>
        </>
      )}
    </div>
  );
}
