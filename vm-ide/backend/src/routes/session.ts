import { Router, Request, Response } from "express";
import { Client } from "ssh2";
import net from "net";
import { createSession, destroySession } from "../sessionStore";
import { generateToken } from "../middleware/auth";

const router = Router();

// ─── SSRF Protection: Block connections to internal/private IPs ───
const PRIVATE_RANGES = [
  /^127\./, /^10\./, /^172\.(1[6-9]|2[0-9]|3[01])\./, /^192\.168\./,
  /^169\.254\./, /^0\./, /^::1$/, /^fc00:/, /^fe80:/, /^fd/,
  /^localhost$/i, /^.*\.local$/i, /^.*\.internal$/i,
];

function isPrivateHost(host: string): boolean {
  // Check against known private patterns
  if (PRIVATE_RANGES.some(r => r.test(host))) return true;
  // Resolve numeric IPs
  if (net.isIPv4(host)) {
    const parts = host.split(".").map(Number);
    if (parts[0] === 0 || parts[0] === 127) return true;
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
  }
  return false;
}

const VALID_USERNAME_RE = /^[a-zA-Z0-9._-]{1,64}$/;
const MAX_HOST_LENGTH = 253;
const MAX_KEY_LENGTH = 16384; // 16KB max for private keys

router.post("/connect", (req: Request, res: Response) => {
  const { host, port = 22, username, authMethod, password, privateKey } = req.body;

  if (!host || !username || !authMethod) {
    res.status(400).json({ error: "host, username, and authMethod are required" });
    return;
  }

  // ─── Input validation ─────────────────────────────────────
  if (typeof host !== "string" || host.length > MAX_HOST_LENGTH) {
    res.status(400).json({ error: "Invalid host" });
    return;
  }

  if (isPrivateHost(host)) {
    res.status(403).json({ error: "Connections to private/internal addresses are not allowed" });
    return;
  }

  const portNum = parseInt(String(port), 10);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    res.status(400).json({ error: "Port must be between 1 and 65535" });
    return;
  }

  if (!VALID_USERNAME_RE.test(username)) {
    res.status(400).json({ error: "Invalid username format" });
    return;
  }

  if (authMethod !== "password" && authMethod !== "key") {
    res.status(400).json({ error: "authMethod must be 'password' or 'key'" });
    return;
  }

  if (authMethod === "password" && !password) {
    res.status(400).json({ error: "password is required for password auth" });
    return;
  }

  if (authMethod === "key") {
    if (!privateKey) {
      res.status(400).json({ error: "privateKey is required for key auth" });
      return;
    }
    if (typeof privateKey !== "string" || privateKey.length > MAX_KEY_LENGTH) {
      res.status(400).json({ error: "Invalid private key" });
      return;
    }
  }

  const conn = new Client();

  const connectConfig: any = {
    host,
    port: parseInt(String(port), 10),
    username,
    readyTimeout: 10_000,
  };

  if (authMethod === "password") {
    connectConfig.password = password;
    connectConfig.tryKeyboard = true;
  } else {
    connectConfig.privateKey = privateKey;
  }

  // Handle keyboard-interactive auth (used by many EC2/cloud instances)
  conn.on("keyboard-interactive", (_name: string, _instructions: string, _lang: string, _prompts: any[], finish: (responses: string[]) => void) => {
    finish([password || ""]);
  });

  conn.on("ready", () => {
    conn.sftp((err, sftp) => {
      if (err) {
        conn.end();
        res.status(500).json({ error: "Failed to open SFTP channel: " + err.message });
        return;
      }
      const sessionId = createSession(conn, sftp, host, username);
      console.log(`[session] Connected: ${sessionId} -> ${username}@${host}:${port}`);
      const token = generateToken({ sessionId, host, username });
      res.json({ sessionId, token });
    });
  });

  conn.on("error", (err) => {
    console.error(`[session] Connection error: ${err.message}`);
    res.status(500).json({ error: "SSH connection failed: " + err.message });
  });

  conn.connect(connectConfig);
});

router.post("/disconnect", (req: Request, res: Response) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }
  const destroyed = destroySession(sessionId);
  if (!destroyed) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  console.log(`[session] Disconnected: ${sessionId}`);
  res.json({ ok: true });
});

export default router;
