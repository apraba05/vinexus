"use client";
import React, { useState, useEffect } from "react";

type UpdateState = "idle" | "available" | "downloading" | "ready";

export default function UpdateBanner() {
  const [state, setState] = useState<UpdateState>("idle");
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined" || !("electronAPI" in window)) return;
    const ea = (window as any).electronAPI;

    const offAvailable = ea.app.onUpdateAvailable((info: { version: string }) => {
      setVersion(info.version);
      setState("downloading");
    });

    const offDownloaded = ea.app.onUpdateDownloaded((info: { version: string }) => {
      setVersion(info.version);
      setState("ready");
    });

    return () => {
      offAvailable?.();
      offDownloaded?.();
    };
  }, []);

  if (state === "idle") return null;

  return (
    <div style={styles.banner}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>

      {state === "downloading" && (
        <span style={styles.text}>
          Vinexus {version} is downloading in the background…
        </span>
      )}

      {state === "ready" && (
        <>
          <span style={styles.text}>
            Vinexus {version} is ready to install.
          </span>
          <button
            style={styles.button}
            onClick={() => (window as any).electronAPI.app.installUpdate()}
          >
            Restart &amp; Update
          </button>
          <button
            style={styles.dismiss}
            onClick={() => setState("idle")}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 14px",
    background: "linear-gradient(90deg, rgba(0,83,219,0.10), rgba(0,83,219,0.06))",
    borderBottom: "1px solid rgba(0, 83, 219, 0.2)",
    fontSize: 12,
    color: "#0053db",
  },
  text: {
    flex: 1,
    color: "#374151",
  },
  button: {
    padding: "3px 12px",
    background: "#0053db",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },
  dismiss: {
    background: "none",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: 12,
    padding: "2px 4px",
    lineHeight: 1,
    flexShrink: 0,
  },
};
