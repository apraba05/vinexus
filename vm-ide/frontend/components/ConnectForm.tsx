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

  const handleDisconnect = async () => {
    if (!sessionId) return;
    try {
      await disconnectSession(sessionId);
    } catch {
      // ignore
    }
    onDisconnect();
  };

  if (sessionId) {
    return (
      <div style={styles.bar}>
        <div style={styles.status}>
          <div style={styles.dotPulse}>
            <span style={styles.dot} />
          </div>
          <span>
            Connected to <strong style={{ color: "var(--text-bright)" }}>{host || "VM"}</strong>
            <span style={{ color: "var(--text-secondary)" }}> as </span>
            <strong style={{ color: "var(--accent-hover)" }}>{username || "user"}</strong>
          </span>
        </div>
        <button onClick={handleDisconnect} style={styles.disconnectBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
          </svg>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div style={styles.bar}>
      <div style={styles.formRow}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Host</label>
          <input
            placeholder="192.168.1.1"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Port</label>
          <input
            placeholder="22"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            style={{ ...styles.input, width: 60 }}
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Username</label>
          <input
            placeholder="ec2-user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Auth</label>
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
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrap}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.passwordInput}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.inputGroup}>
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {keyFileName ? (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {keyFileName}
                </span>
              ) : (
                "Upload .pem file"
              )}
            </button>
          </div>
        )}
        <button onClick={handleConnect} disabled={loading} style={styles.connectBtn}>
          {loading ? (
            <span style={styles.loadingDots}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Connecting...
            </span>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
              Connect
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    alignItems: "center",
    padding: "8px 16px",
    background: "linear-gradient(180deg, var(--bg-tertiary), var(--bg-secondary))",
    borderBottom: "1px solid var(--border)",
    flexWrap: "wrap",
    gap: 8,
  },
  formRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    flexWrap: "wrap",
    flex: 1,
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "var(--text-secondary)",
  },
  input: {
    padding: "6px 10px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text-primary)",
    width: 140,
  },
  passwordWrap: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
  },
  passwordInput: {
    padding: "6px 34px 6px 10px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text-primary)",
    width: 160,
  },
  eyeBtn: {
    position: "absolute" as const,
    right: 4,
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
    padding: "6px 12px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text-primary)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    whiteSpace: "nowrap" as const,
  },
  select: {
    padding: "6px 10px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text-primary)",
    cursor: "pointer",
  },
  connectBtn: {
    padding: "6px 20px",
    background: "var(--gradient-1)",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    boxShadow: "0 2px 8px var(--accent-glow)",
  },
  loadingDots: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  disconnectBtn: {
    padding: "6px 14px",
    background: "rgba(255, 107, 107, 0.15)",
    color: "var(--danger)",
    border: "1px solid rgba(255, 107, 107, 0.3)",
    borderRadius: 6,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    fontSize: 12,
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flex: 1,
    color: "var(--text-primary)",
    fontSize: 13,
  },
  dotPulse: {
    display: "flex",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--success)",
    display: "inline-block",
    boxShadow: "0 0 6px var(--success)",
    animation: "pulse 2s ease-in-out infinite",
  },
};
