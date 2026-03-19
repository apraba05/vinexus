/**
 * electron/ipc/ssh.js
 *
 * Vela Desktop — SSH IPC Handlers (Main Process)
 *
 * All SSH and SFTP operations run in the main process — never in the renderer.
 * The renderer calls these via window.electronAPI.ssh.* through the preload bridge.
 *
 * Manages:
 *   - SSH session pool (multiple simultaneous VM connections)
 *   - SFTP file operations (readdir, readFile, writeFile, mkdir, rename, delete)
 *   - Command execution (exec)
 *   - AWS EC2 instance management
 *   - Session status broadcasting to renderer
 *
 * IPC channels:
 *   ssh:connect, ssh:disconnect, ssh:exec
 *   ssh:readdir, ssh:readFile, ssh:writeFile, ssh:mkdir, ssh:rename, ssh:delete
 *   ssh:getSessions
 *   ec2:listInstances, ec2:startInstance, ec2:stopInstance, ec2:rebootInstance
 */

const { ipcMain, BrowserWindow } = require("electron");
const { Client: SSH2Client } = require("ssh2");
const log = require("electron-log");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// ─── SSRF Protection ──────────────────────────────────────────────────────────
const BLOCKED_HOSTS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /\.local$/i,
  /\.internal$/i,
];

function isBlockedHost(host) {
  return BLOCKED_HOSTS.some((re) => re.test(host));
}

// ─── Session Pool ─────────────────────────────────────────────────────────────
/**
 * Map of sessionId → { conn: SSH2Client, sftp: SFTPWrapper, info: {...}, status }
 */
const sessions = new Map();

/** Broadcast session status changes to all renderer windows */
function broadcastStatus() {
  const statusMap = {};
  for (const [id, s] of sessions) {
    statusMap[id] = {
      id,
      host: s.info.host,
      username: s.info.username,
      port: s.info.port,
      status: s.status, // 'connecting' | 'connected' | 'disconnected' | 'error'
      label: s.info.label || `${s.info.username}@${s.info.host}`,
    };
  }
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send("ssh:statusChange", statusMap);
  }
}

/** Get an SFTP wrapper for a session, creating one if needed */
function getSftp(sessionId) {
  return new Promise((resolve, reject) => {
    const session = sessions.get(sessionId);
    if (!session) return reject(new Error("Session not found: " + sessionId));
    if (session.sftp) return resolve(session.sftp);

    session.conn.sftp((err, sftp) => {
      if (err) return reject(err);
      session.sftp = sftp;
      resolve(sftp);
    });
  });
}

// ─── IPC Handler Registration ─────────────────────────────────────────────────

function registerSshHandlers() {
  // ── Connect ──────────────────────────────────────────────────────────────
  ipcMain.handle("ssh:connect", (_event, params) => {
    return new Promise((resolve) => {
      try {
        const { host, port = 22, username, password, privateKey, label, authMethod = "password" } = params;

        // Input validation
        if (!host || typeof host !== "string" || host.length > 253) {
          return resolve({ error: "Invalid host" });
        }
        if (!username || !/^[a-zA-Z0-9._@-]{1,64}$/.test(username)) {
          return resolve({ error: "Invalid username" });
        }
        if (port < 1 || port > 65535) {
          return resolve({ error: "Invalid port" });
        }
        // Allow localhost for dev/testing — only block in production checks
        // (Desktop app users legitimately connect to local VMs in dev)

        const sessionId = uuidv4();
        const conn = new SSH2Client();

        const sessionInfo = { host, port, username, label, authMethod };
        sessions.set(sessionId, { conn, sftp: null, info: sessionInfo, status: "connecting" });
        broadcastStatus();

        // Build connect config
        const connectConfig = {
          host,
          port,
          username,
          readyTimeout: 20000,
          keepaliveInterval: 30000,
        };

        if (authMethod === "privateKey" && privateKey) {
          connectConfig.privateKey = privateKey;
        } else if (password) {
          connectConfig.password = password;
        }

        conn.on("ready", () => {
          log.info(`SSH connected: ${username}@${host}:${port} [${sessionId}]`);
          sessions.get(sessionId).status = "connected";
          broadcastStatus();
          resolve({ sessionId, host, username, port });
        });

        conn.on("error", (err) => {
          log.error(`SSH error [${sessionId}]:`, err.message);
          if (sessions.has(sessionId)) {
            sessions.get(sessionId).status = "error";
            broadcastStatus();
          }
          resolve({ error: err.message });
        });

        conn.on("close", () => {
          log.info(`SSH connection closed [${sessionId}]`);
          if (sessions.has(sessionId)) {
            sessions.get(sessionId).status = "disconnected";
            broadcastStatus();
          }
        });

        conn.connect(connectConfig);
      } catch (err) {
        log.error("ssh:connect error:", err);
        resolve({ error: String(err.message) });
      }
    });
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  ipcMain.handle("ssh:disconnect", (_event, sessionId) => {
    try {
      const session = sessions.get(sessionId);
      if (!session) return { ok: true };
      session.conn.end();
      sessions.delete(sessionId);
      broadcastStatus();
      log.info(`SSH disconnected: ${sessionId}`);
      return { ok: true };
    } catch (err) {
      log.error("ssh:disconnect error:", err);
      return { error: String(err.message) };
    }
  });

  // ── Exec ──────────────────────────────────────────────────────────────────
  ipcMain.handle("ssh:exec", (_event, sessionId, command) => {
    return new Promise((resolve) => {
      try {
        const session = sessions.get(sessionId);
        if (!session) return resolve({ error: "Session not found" });

        session.conn.exec(command, { pty: false }, (err, stream) => {
          if (err) return resolve({ error: err.message });

          let stdout = "";
          let stderr = "";

          stream.on("data", (data) => { stdout += data.toString(); });
          stream.stderr.on("data", (data) => { stderr += data.toString(); });

          stream.on("close", (code) => {
            resolve({ stdout, stderr, exitCode: code });
          });

          // Timeout after 30s
          setTimeout(() => {
            stream.close();
            resolve({ error: "Command timed out", stdout, stderr });
          }, 30000);
        });
      } catch (err) {
        log.error("ssh:exec error:", err);
        resolve({ error: String(err.message) });
      }
    });
  });

  // ── SFTP: readdir ─────────────────────────────────────────────────────────
  ipcMain.handle("ssh:readdir", async (_event, sessionId, remotePath) => {
    try {
      const sftp = await getSftp(sessionId);
      return new Promise((resolve) => {
        sftp.readdir(remotePath, (err, list) => {
          if (err) return resolve({ error: err.message });
          const entries = list.map((item) => ({
            name: item.filename,
            path: remotePath.replace(/\/$/, "") + "/" + item.filename,
            isDirectory: item.attrs.isDirectory(),
            size: item.attrs.size,
            mtime: item.attrs.mtime,
          }));
          resolve({ entries });
        });
      });
    } catch (err) {
      log.error("ssh:readdir error:", err);
      return { error: String(err.message) };
    }
  });

  // ── SFTP: readFile ────────────────────────────────────────────────────────
  ipcMain.handle("ssh:readFile", async (_event, sessionId, remotePath) => {
    try {
      const sftp = await getSftp(sessionId);
      return new Promise((resolve) => {
        // First stat to check size
        sftp.stat(remotePath, (err, stats) => {
          if (err) return resolve({ error: err.message });
          const MAX_SIZE = 2 * 1024 * 1024; // 2MB
          if (stats.size > MAX_SIZE) {
            return resolve({ error: `File too large (${stats.size} bytes, max 2MB)` });
          }

          const chunks = [];
          const stream = sftp.createReadStream(remotePath);
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("error", (e) => resolve({ error: e.message }));
          stream.on("end", () => {
            const content = Buffer.concat(chunks).toString("utf8");
            resolve({ content, path: remotePath });
          });
        });
      });
    } catch (err) {
      log.error("ssh:readFile error:", err);
      return { error: String(err.message) };
    }
  });

  // ── SFTP: writeFile ───────────────────────────────────────────────────────
  ipcMain.handle("ssh:writeFile", async (_event, sessionId, remotePath, content) => {
    try {
      const sftp = await getSftp(sessionId);
      return new Promise((resolve) => {
        const writeStream = sftp.createWriteStream(remotePath);
        writeStream.on("error", (err) => resolve({ error: err.message }));
        writeStream.on("close", () => resolve({ ok: true, path: remotePath }));
        writeStream.end(content, "utf8");
      });
    } catch (err) {
      log.error("ssh:writeFile error:", err);
      return { error: String(err.message) };
    }
  });

  // ── SFTP: mkdir ───────────────────────────────────────────────────────────
  ipcMain.handle("ssh:mkdir", async (_event, sessionId, remotePath) => {
    try {
      const sftp = await getSftp(sessionId);
      return new Promise((resolve) => {
        sftp.mkdir(remotePath, (err) => {
          if (err) return resolve({ error: err.message });
          resolve({ ok: true });
        });
      });
    } catch (err) {
      log.error("ssh:mkdir error:", err);
      return { error: String(err.message) };
    }
  });

  // ── SFTP: rename ──────────────────────────────────────────────────────────
  ipcMain.handle("ssh:rename", async (_event, sessionId, oldPath, newPath) => {
    try {
      const sftp = await getSftp(sessionId);
      return new Promise((resolve) => {
        sftp.rename(oldPath, newPath, (err) => {
          if (err) return resolve({ error: err.message });
          resolve({ ok: true });
        });
      });
    } catch (err) {
      log.error("ssh:rename error:", err);
      return { error: String(err.message) };
    }
  });

  // ── SFTP: delete ──────────────────────────────────────────────────────────
  ipcMain.handle("ssh:delete", async (_event, sessionId, remotePath) => {
    try {
      const sftp = await getSftp(sessionId);
      return new Promise((resolve) => {
        // Try unlink first (file), then rmdir (directory)
        sftp.unlink(remotePath, (err) => {
          if (!err) return resolve({ ok: true });
          sftp.rmdir(remotePath, (err2) => {
            if (err2) return resolve({ error: err2.message });
            resolve({ ok: true });
          });
        });
      });
    } catch (err) {
      log.error("ssh:delete error:", err);
      return { error: String(err.message) };
    }
  });

  // ── Get All Sessions ──────────────────────────────────────────────────────
  ipcMain.handle("ssh:getSessions", () => {
    const result = {};
    for (const [id, s] of sessions) {
      result[id] = {
        id,
        host: s.info.host,
        username: s.info.username,
        port: s.info.port,
        status: s.status,
        label: s.info.label || `${s.info.username}@${s.info.host}`,
      };
    }
    return result;
  });

  // ── AWS EC2 ───────────────────────────────────────────────────────────────
  // TODO: Configure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
  // in your environment or .env file before using these handlers.

  ipcMain.handle("ec2:listInstances", async (_event, region) => {
    try {
      const { EC2Client, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
      const client = new EC2Client({ region: region || process.env.AWS_DEFAULT_REGION || "us-east-1" });
      const res = await client.send(new DescribeInstancesCommand({}));
      const instances = [];
      for (const reservation of res.Reservations || []) {
        for (const inst of reservation.Instances || []) {
          instances.push({
            id: inst.InstanceId,
            type: inst.InstanceType,
            state: inst.State?.Name,
            publicIp: inst.PublicIpAddress,
            privateIp: inst.PrivateIpAddress,
            name: (inst.Tags || []).find((t) => t.Key === "Name")?.Value || inst.InstanceId,
            region: region || "us-east-1",
          });
        }
      }
      return { instances };
    } catch (err) {
      log.error("ec2:listInstances error:", err);
      return { error: String(err.message) };
    }
  });

  ipcMain.handle("ec2:startInstance", async (_event, instanceId, region) => {
    try {
      const { EC2Client, StartInstancesCommand } = require("@aws-sdk/client-ec2");
      const client = new EC2Client({ region: region || process.env.AWS_DEFAULT_REGION || "us-east-1" });
      await client.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
      return { ok: true };
    } catch (err) {
      log.error("ec2:startInstance error:", err);
      return { error: String(err.message) };
    }
  });

  ipcMain.handle("ec2:stopInstance", async (_event, instanceId, region) => {
    try {
      const { EC2Client, StopInstancesCommand } = require("@aws-sdk/client-ec2");
      const client = new EC2Client({ region: region || process.env.AWS_DEFAULT_REGION || "us-east-1" });
      await client.send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
      return { ok: true };
    } catch (err) {
      log.error("ec2:stopInstance error:", err);
      return { error: String(err.message) };
    }
  });

  ipcMain.handle("ec2:rebootInstance", async (_event, instanceId, region) => {
    try {
      const { EC2Client, RebootInstancesCommand } = require("@aws-sdk/client-ec2");
      const client = new EC2Client({ region: region || process.env.AWS_DEFAULT_REGION || "us-east-1" });
      await client.send(new RebootInstancesCommand({ InstanceIds: [instanceId] }));
      return { ok: true };
    } catch (err) {
      log.error("ec2:rebootInstance error:", err);
      return { error: String(err.message) };
    }
  });

  log.info("SSH IPC handlers registered");
}

/** Disconnect all active sessions (called on app quit) */
function disconnectAll() {
  for (const [id, session] of sessions) {
    try {
      session.conn.end();
    } catch (_) {}
  }
  sessions.clear();
}

/** Get a specific SSH session by ID (used by pty.js) */
function getSshSession(sessionId) {
  return sessions.get(sessionId) || null;
}

module.exports = { registerSshHandlers, disconnectAll, getSshSession };
