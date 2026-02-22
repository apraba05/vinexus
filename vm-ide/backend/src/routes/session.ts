import { Router, Request, Response } from "express";
import { Client } from "ssh2";
import { createSession, destroySession } from "../sessionStore";
import { generateToken } from "../middleware/auth";

const router = Router();

router.post("/connect", (req: Request, res: Response) => {
  const { host, port = 22, username, authMethod, password, privateKey } = req.body;

  if (!host || !username || !authMethod) {
    res.status(400).json({ error: "host, username, and authMethod are required" });
    return;
  }

  if (authMethod === "password" && !password) {
    res.status(400).json({ error: "password is required for password auth" });
    return;
  }

  if (authMethod === "key" && !privateKey) {
    res.status(400).json({ error: "privateKey is required for key auth" });
    return;
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
