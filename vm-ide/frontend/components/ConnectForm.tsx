"use client";
import React, { useState, useRef } from "react";
import { connectSession, disconnectSession } from "@/lib/api";

interface Props {
  sessionId: string | null;
  onConnect: (sessionId: string, host: string, username: string) => void;
  onDisconnect: () => void;
  onError: (msg: string) => void;
}

export default function ConnectForm({ sessionId, onConnect, onDisconnect, onError }: Props) {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("22");
  const [username, setUsername] = useState("");
  const [authMethod, setAuthMethod] = useState<"password" | "key">("password");
  const [password, setPassword] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [keyFileName, setKeyFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setKeyFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setPrivateKey(content);
    };
    reader.onerror = () => {
      onError("Failed to read key file");
    };
    reader.readAsText(file);
  };

  const handleConnect = async () => {
    if (!host || !username) {
      onError("Host and username are required");
      return;
    }
    setLoading(true);
    try {
      const res = await connectSession({
        host,
        port: parseInt(port, 10),
        username,
        authMethod,
        password: authMethod === "password" ? password : undefined,
        privateKey: authMethod === "key" ? privateKey : undefined,
      });
      onConnect(res.sessionId, host, username);
      setPassword("");
      setPrivateKey("");
      setKeyFileName("");
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // When connected, render nothing — title bar handles disconnect
  if (sessionId) return null;

  // When disconnected, render a full-screen modal overlay
  return (
    <div style={styles.overlay}>
      {/* Particle dots background (Antigravity-inspired) */}
      <div style={styles.particles} aria-hidden>
        {[...Array(24)].map((_, i) => (
          <span key={i} style={{
            ...styles.particle,
            left: `${(i * 17 + 5) % 98}%`,
            top: `${(i * 23 + 8) % 92}%`,
            opacity: 0.08 + (i % 5) * 0.04,
            width: i % 3 === 0 ? 3 : 2,
            height: i % 3 === 0 ? 3 : 2,
            background: i % 4 === 0 ? "#3fffa2" : i % 4 === 1 ? "#4f8ef7" : i % 4 === 2 ? "#a78bfa" : "#fca98d",
          }} />
        ))}
      </div>

      <div style={styles.dialog}>
        {/* Header */}
        <div style={styles.dialogHeader}>
          <div style={styles.logoMark}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <h1 style={styles.dialogTitle}>Vela</h1>
          <p style={styles.dialogSub}>Connect to your remote VM via SSH</p>
        </div>

        {/* Form */}
        <div style={styles.formGrid}>
          <div style={styles.fieldRow}>
            <div style={styles.field}>
              <label style={styles.label}>Host</label>
              <input
                placeholder="192.168.1.1"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                style={styles.input}
                autoFocus
              />
            </div>
            <div style={{ ...styles.field, flex: "0 0 72px" }}>
              <label style={styles.label}>Port</label>
              <input
                placeholder="22"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                placeholder="ec2-user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.fieldRow}>
            <div style={{ ...styles.field, flex: "0 0 140px" }}>
              <label style={styles.label}>Auth Method</label>
              <select
                value={authMethod}
                onChange={(e) => setAuthMethod(e.target.value as "password" | "key")}
                style={styles.select}
              >
                <option value="password">Password</option>
                <option value="key">Private Key</option>
              </select>
            </div>

            {authMethod === "password" ? (
              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <div style={styles.passwordWrap}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...styles.input, paddingRight: 38 }}
                    onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.field}>
                <label style={styles.label}>Private Key</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  accept=".pem,.key,.ppk,.pub,*"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={styles.uploadBtn}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {keyFileName ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {keyFileName}
                    </span>
                  ) : (
                    "Upload .pem / key file"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Connect button */}
        <button
          onClick={handleConnect}
          disabled={loading}
          style={styles.connectBtn}
        >
          {loading ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Connecting…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
              Connect
            </>
          )}
        </button>

        <p style={styles.hint}>
          Connection is encrypted end-to-end via SSH
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--gradient-hero)",
    overflow: "hidden",
  },
  particles: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  particle: {
    position: "absolute",
    borderRadius: "50%",
  },
  dialog: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 520,
    margin: "0 20px",
    background: "rgba(13, 21, 40, 0.85)",
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: "40px 36px 32px",
    boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(63,255,162,0.06)",
    animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  dialogHeader: {
    textAlign: "center",
    marginBottom: 32,
  },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: "rgba(63, 255, 162, 0.06)",
    border: "1px solid rgba(63, 255, 162, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--text-bright)",
    letterSpacing: "-0.02em",
    margin: 0,
    marginBottom: 6,
  },
  dialogSub: {
    fontSize: 13,
    color: "var(--text-secondary)",
    margin: 0,
  },
  formGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    marginBottom: 20,
  },
  fieldRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--text-secondary)",
  },
  input: {
    padding: "9px 12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    color: "var(--text-bright)",
    fontSize: 13,
    width: "100%",
    transition: "all 0.2s ease",
  },
  select: {
    padding: "9px 12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    color: "var(--text-primary)",
    fontSize: 13,
    cursor: "pointer",
    width: "100%",
  },
  passwordWrap: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
  },
  eyeBtn: {
    position: "absolute" as const,
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "var(--text-secondary)",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    cursor: "pointer",
  },
  uploadBtn: {
    padding: "9px 12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    color: "var(--text-primary)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 13,
    whiteSpace: "nowrap" as const,
    width: "100%",
  },
  connectBtn: {
    width: "100%",
    padding: "12px 24px",
    background: "var(--gradient-brand)",
    color: "#0b1120",
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(63, 255, 162, 0.25)",
    transition: "all 0.2s ease",
    marginBottom: 14,
  },
  hint: {
    textAlign: "center",
    fontSize: 11,
    color: "var(--text-secondary)",
    margin: 0,
  },
};
