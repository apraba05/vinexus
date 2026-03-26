/**
 * electron/preload.js
 *
 * Vinexus Desktop — Preload Script (Context Bridge)
 *
 * Exposes safe, typed IPC channels from Electron's main process to the
 * renderer (React/Next.js). All Node.js / native operations must go
 * through this bridge — never directly in the renderer.
 *
 * Security: contextIsolation: true, nodeIntegration: false
 *
 * Available on window.electronAPI in the renderer.
 */

const { contextBridge, ipcRenderer } = require("electron");

// ─── Helper to strip IPC listeners when component unmounts ───────────────────
function on(channel, callback) {
  const sub = (_event, ...args) => callback(...args);
  ipcRenderer.on(channel, sub);
  return () => ipcRenderer.removeListener(channel, sub);
}

// ─── Expose API ───────────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld("electronAPI", {
  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    /** Clear the stored desktop session (logout) */
    logout: () => ipcRenderer.invoke("auth:logout"),
    /** Get a stored token by key */
    getToken: (key) => ipcRenderer.invoke("auth:getToken", key),
    /** Persist a token */
    setToken: (key, value) => ipcRenderer.invoke("auth:setToken", key, value),
    /** Clear a stored token */
    clearToken: (key) => ipcRenderer.invoke("auth:clearToken", key),
    /** Get all stored VM credentials */
    getVmCredentials: () => ipcRenderer.invoke("auth:getVmCredentials"),
    /** Save VM connection credentials */
    saveVmCredentials: (id, creds) => ipcRenderer.invoke("auth:saveVmCredentials", id, creds),
    /** Delete VM credentials */
    deleteVmCredentials: (id) => ipcRenderer.invoke("auth:deleteVmCredentials", id),
    /** Listen for OAuth deep-link callback */
    onDeepLink: (callback) => on("auth:deep-link", callback),
    /** Called by main process after a successful browser-based login — carries the user object */
    onUserLoggedIn: (callback) => on("auth:user-logged-in", callback),
    /** Listen for any desktop auth session update */
    onSessionChanged: (callback) => on("auth:session-changed", callback),
    /** Authenticate with email + password (desktop-only) */
    login: (creds) => ipcRenderer.invoke("auth:desktopLogin", creds),
    /** Register a new account then auto-login (desktop-only) */
    register: (creds) => ipcRenderer.invoke("auth:desktopRegister", creds),
    /** Get the currently stored desktop session */
    getSession: () => ipcRenderer.invoke("auth:getSession"),
    /** Sync the user's plan from the server */
    syncPlan: () => ipcRenderer.invoke("auth:syncPlan"),
  },

  // ── SSH Session Management ─────────────────────────────────────────────────
  ssh: {
    /** Connect to a remote VM via SSH */
    connect: (params) => ipcRenderer.invoke("ssh:connect", params),
    /** Disconnect a session */
    disconnect: (sessionId) => ipcRenderer.invoke("ssh:disconnect", sessionId),
    /** Execute a command and return full output */
    exec: (sessionId, command) => ipcRenderer.invoke("ssh:exec", sessionId, command),
    /** List directory contents via SFTP */
    readdir: (sessionId, remotePath) => ipcRenderer.invoke("ssh:readdir", sessionId, remotePath),
    /** Read a file via SFTP */
    readFile: (sessionId, remotePath) => ipcRenderer.invoke("ssh:readFile", sessionId, remotePath),
    /** Write a file via SFTP */
    writeFile: (sessionId, remotePath, content) =>
      ipcRenderer.invoke("ssh:writeFile", sessionId, remotePath, content),
    /** Create a directory via SFTP */
    mkdir: (sessionId, remotePath) => ipcRenderer.invoke("ssh:mkdir", sessionId, remotePath),
    /** Rename/move a file via SFTP */
    rename: (sessionId, oldPath, newPath) =>
      ipcRenderer.invoke("ssh:rename", sessionId, oldPath, newPath),
    /** Delete a file or directory */
    delete: (sessionId, remotePath) => ipcRenderer.invoke("ssh:delete", sessionId, remotePath),
    /** Get all active session states */
    getSessions: () => ipcRenderer.invoke("ssh:getSessions"),
    /** Listen for session status changes */
    onStatusChange: (callback) => on("ssh:statusChange", callback),
  },

  // ── PTY Terminal ──────────────────────────────────────────────────────────
  pty: {
    /** Create a new PTY session tied to an SSH session */
    create: (sessionId, cols, rows) => ipcRenderer.invoke("pty:create", sessionId, cols, rows),
    /** Write data (keystrokes) to PTY stdin */
    write: (ptyId, data) => ipcRenderer.send("pty:write", ptyId, data),
    /** Resize the PTY */
    resize: (ptyId, cols, rows) => ipcRenderer.send("pty:resize", ptyId, cols, rows),
    /** Destroy/close the PTY */
    destroy: (ptyId) => ipcRenderer.invoke("pty:destroy", ptyId),
    /** Listen for PTY output */
    onData: (callback) => on("pty:data", callback),
    /** Listen for PTY exit */
    onExit: (callback) => on("pty:exit", callback),
  },

  // ── AWS EC2 ───────────────────────────────────────────────────────────────
  ec2: {
    /** List EC2 instances (requires AWS credentials in env) */
    listInstances: (region) => ipcRenderer.invoke("ec2:listInstances", region),
    /** Start an EC2 instance */
    startInstance: (instanceId, region) => ipcRenderer.invoke("ec2:startInstance", instanceId, region),
    /** Stop an EC2 instance */
    stopInstance: (instanceId, region) => ipcRenderer.invoke("ec2:stopInstance", instanceId, region),
    /** Reboot an EC2 instance */
    rebootInstance: (instanceId, region) =>
      ipcRenderer.invoke("ec2:rebootInstance", instanceId, region),
  },

  // ── Window / App Controls ─────────────────────────────────────────────────
  app: {
    /** Get app version */
    getVersion: () => ipcRenderer.invoke("app:getVersion"),
    /** Open a URL in the system browser */
    openExternal: (url) => ipcRenderer.invoke("app:openExternal", url),
    /** Show save-file dialog */
    showSaveDialog: (options) => ipcRenderer.invoke("app:showSaveDialog", options),
    /** Install downloaded update and restart */
    installUpdate: () => ipcRenderer.invoke("updater:install-and-restart"),
    /** Listen for update-available notification */
    onUpdateAvailable: (callback) => on("updater:update-available", callback),
    /** Listen for update-downloaded notification */
    onUpdateDownloaded: (callback) => on("updater:update-downloaded", callback),
  },

  // ── Panel State Persistence ───────────────────────────────────────────────
  prefs: {
    /** Get a UI preference value */
    get: (key, defaultValue) => ipcRenderer.invoke("prefs:get", key, defaultValue),
    /** Set a UI preference value */
    set: (key, value) => ipcRenderer.invoke("prefs:set", key, value),
  },
});

// ─── Menu IPC → DOM CustomEvent bridge ────────────────────────────────────────
// menu.js sends events via webContents.send("menu:*") which are IPC events, not
// DOM events. The renderer listens with window.addEventListener("menu:*") which
// only fires for DOM events. Bridge them here so both sides work without changes.
const MENU_CHANNELS = [
  "menu:save", "menu:saveAll", "menu:newFile", "menu:newFolder", "menu:closeTab",
  "menu:openSettings", "menu:find", "menu:replace", "menu:commandPalette",
  "menu:toggleSidebar", "menu:toggleTerminal", "menu:toggleAI",
  "menu:newTerminal", "menu:clearTerminal",
  "menu:newConnection", "menu:disconnectVM",
  "menu:deploy", "menu:runCommand", "menu:validate",
];
for (const channel of MENU_CHANNELS) {
  ipcRenderer.on(channel, () => window.dispatchEvent(new CustomEvent(channel)));
}
