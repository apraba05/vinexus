/**
 * electron/ipc/pty.js
 *
 * Vela Desktop — PTY IPC Handlers (Main Process)
 *
 * Creates interactive terminal sessions over SSH using node-pty.
 * Each PTY is tied to an SSH session and streams data bidirectionally
 * with xterm.js in the renderer.
 *
 * IPC channels:
 *   pty:create  — create a new PTY (returns ptyId)
 *   pty:write   — write keystrokes to PTY stdin
 *   pty:resize  — resize terminal dimensions
 *   pty:destroy — close PTY and cleanup
 *
 * Events pushed to renderer:
 *   pty:data    — terminal output (string)
 *   pty:exit    — PTY closed (exitCode, signal)
 */

const { ipcMain, BrowserWindow } = require("electron");
const log = require("electron-log");
const { v4: uuidv4 } = require("uuid");

// ─── PTY Pool ─────────────────────────────────────────────────────────────────
/** Map of ptyId → { channel, stream, sessionId } */
const ptyMap = new Map();

/** Send PTY data to the renderer window that created it */
function sendToRenderer(webContentsId, channel, ...args) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.webContents.id === webContentsId) {
      win.webContents.send(channel, ...args);
      return;
    }
  }
  // Fallback: send to all windows
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, ...args);
  }
}

// ─── IPC Handler Registration ─────────────────────────────────────────────────

function registerPtyHandlers() {
  /**
   * pty:create
   * Creates a PTY shell on the remote VM via SSH.
   * Falls back to a local PTY if no sessionId is provided.
   */
  ipcMain.handle("pty:create", (event, sessionId, cols = 80, rows = 24) => {
    return new Promise((resolve) => {
      try {
        // If we have an SSH session, open a PTY shell on the remote VM
        if (sessionId) {
          // Import the session pool from ssh.js
          // We require it lazily to avoid circular deps
          const sshMod = require("./ssh");

          // Access ssh sessions via a helper
          // (We'll need to export the sessions map or a getter)
          const { getSshSession } = sshMod;
          const session = getSshSession ? getSshSession(sessionId) : null;

          if (!session) {
            return resolve({ error: "SSH session not found: " + sessionId });
          }

          const ptyId = uuidv4();
          const webContentsId = event.sender.id;

          session.conn.shell(
            {
              term: "xterm-256color",
              cols,
              rows,
            },
            (err, stream) => {
              if (err) {
                log.error("pty:create shell error:", err);
                return resolve({ error: err.message });
              }

              ptyMap.set(ptyId, { stream, sessionId, webContentsId });

              stream.on("data", (data) => {
                sendToRenderer(webContentsId, "pty:data", ptyId, data.toString());
              });

              stream.on("close", (code, signal) => {
                log.info(`PTY closed [${ptyId}]: code=${code} signal=${signal}`);
                ptyMap.delete(ptyId);
                sendToRenderer(webContentsId, "pty:exit", ptyId, code, signal);
              });

              stream.stderr.on("data", (data) => {
                sendToRenderer(webContentsId, "pty:data", ptyId, data.toString());
              });

              log.info(`PTY created [${ptyId}] for session [${sessionId}]`);
              resolve({ ptyId });
            }
          );
        } else {
          // No SSH session — open a local shell (useful for debugging)
          let pty;
          try {
            pty = require("node-pty");
          } catch (e) {
            return resolve({ error: "node-pty not available: " + e.message });
          }

          const shell =
            process.platform === "win32"
              ? "powershell.exe"
              : process.env.SHELL || "/bin/bash";

          const ptyId = uuidv4();
          const webContentsId = event.sender.id;

          const ptyProcess = pty.spawn(shell, [], {
            name: "xterm-256color",
            cols,
            rows,
            cwd: process.env.HOME,
            env: process.env,
          });

          ptyMap.set(ptyId, { ptyProcess, sessionId: null, webContentsId });

          ptyProcess.onData((data) => {
            sendToRenderer(webContentsId, "pty:data", ptyId, data);
          });

          ptyProcess.onExit(({ exitCode, signal }) => {
            log.info(`Local PTY closed [${ptyId}]: code=${exitCode}`);
            ptyMap.delete(ptyId);
            sendToRenderer(webContentsId, "pty:exit", ptyId, exitCode, signal);
          });

          log.info(`Local PTY created [${ptyId}]`);
          resolve({ ptyId });
        }
      } catch (err) {
        log.error("pty:create error:", err);
        resolve({ error: String(err.message) });
      }
    });
  });

  /**
   * pty:write — send keystrokes/data to the PTY
   * This is a fire-and-forget (ipcMain.on, not handle)
   */
  ipcMain.on("pty:write", (_event, ptyId, data) => {
    const pty = ptyMap.get(ptyId);
    if (!pty) return;
    try {
      if (pty.stream) {
        // SSH shell stream
        pty.stream.write(data);
      } else if (pty.ptyProcess) {
        // Local node-pty
        pty.ptyProcess.write(data);
      }
    } catch (err) {
      log.error("pty:write error:", err);
    }
  });

  /**
   * pty:resize — update terminal dimensions
   */
  ipcMain.on("pty:resize", (_event, ptyId, cols, rows) => {
    const pty = ptyMap.get(ptyId);
    if (!pty) return;
    try {
      if (pty.stream) {
        // SSH shell: send resize via setWindow
        pty.stream.setWindow(rows, cols, 0, 0);
      } else if (pty.ptyProcess) {
        pty.ptyProcess.resize(cols, rows);
      }
    } catch (err) {
      log.error("pty:resize error:", err);
    }
  });

  /**
   * pty:destroy — close and remove the PTY
   */
  ipcMain.handle("pty:destroy", (_event, ptyId) => {
    const pty = ptyMap.get(ptyId);
    if (!pty) return { ok: true };
    try {
      if (pty.stream) pty.stream.close();
      if (pty.ptyProcess) pty.ptyProcess.kill();
      ptyMap.delete(ptyId);
      log.info(`PTY destroyed [${ptyId}]`);
      return { ok: true };
    } catch (err) {
      log.error("pty:destroy error:", err);
      return { error: String(err.message) };
    }
  });

  log.info("PTY IPC handlers registered");
}

/** Close all open PTYs (called on app quit) */
function cleanupPty() {
  for (const [ptyId, pty] of ptyMap) {
    try {
      if (pty.stream) pty.stream.close();
      if (pty.ptyProcess) pty.ptyProcess.kill();
    } catch (_) {}
  }
  ptyMap.clear();
  log.info("All PTYs cleaned up");
}

module.exports = { registerPtyHandlers, cleanupPty };
