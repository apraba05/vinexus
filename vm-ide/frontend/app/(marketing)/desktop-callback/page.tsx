"use client";

/**
 * /desktop-callback
 *
 * Landing page after the user completes OAuth on vinexus.space from the
 * Vinexus Desktop app. Flow:
 *
 *   1. Desktop app opens browser → vinexus.space/api/auth/signin/[provider]?callbackUrl=/desktop-callback
 *   2. User authenticates with Google / GitHub
 *   3. NextAuth redirects back here with the session established
 *   4. This page reads the session and fires vinexus://auth/callback?user=BASE64_JSON
 *   5. Electron catches the deep link → stores user → navigates to the IDE
 */

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function DesktopCallbackPage() {
  const { data: session, status } = useSession();
  const [state, setState] = useState<"loading" | "redirecting" | "error">("loading");

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !session?.user) {
      setState("error");
      return;
    }

    const user = {
      id: (session.user as { id?: string }).id ?? "",
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      image: session.user.image ?? null,
      plan: (session.user as { plan?: string }).plan ?? "free",
    };

    const encoded = btoa(JSON.stringify(user));
    const deepLink = `vinexus://auth/callback?user=${encodeURIComponent(encoded)}`;

    setState("redirecting");
    // Fire the deep link — Electron intercepts this via the registered protocol handler
    window.location.href = deepLink;
  }, [session, status]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        gap: "16px",
      }}
    >
      {state === "loading" || state === "redirecting" ? (
        <>
          <div
            style={{
              width: 32,
              height: 32,
              border: "2px solid rgba(255,255,255,0.15)",
              borderTopColor: "rgba(255,255,255,0.6)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: 14 }}>
            {state === "redirecting" ? "Returning to Vinexus…" : "Completing sign-in…"}
          </p>
        </>
      ) : (
        <>
          <p style={{ color: "#f87171", margin: 0 }}>Sign-in failed. Please try again in the desktop app.</p>
        </>
      )}
    </div>
  );
}
