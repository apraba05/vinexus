/**
 * electron/ipc/auth.js
 *
 * Vinexus Desktop — Auth IPC Handlers
 *
 * Manages secure token and credential storage using electron-store with
 * AES-256 encryption. The renderer never touches Node.js / file system
 * directly — it calls these handlers via contextBridge.
 *
 * IPC channels:
 *   auth:getToken         — retrieve a stored token
 *   auth:setToken         — store a token
 *   auth:clearToken       — delete a stored token
 *   auth:getVmCredentials — get all saved VM credentials
 *   auth:saveVmCredentials — save VM credentials (encrypted)
 *   auth:deleteVmCredentials — remove VM credentials
 *   prefs:get             — read a UI preference
 *   prefs:set             — write a UI preference
 *   app:getVersion        — return app.getVersion()
 *   app:openExternal      — open a URL in the system browser
 */

const { ipcMain, app, shell } = require("electron");
const Store = require("electron-store");
const log = require("electron-log");
const http = require("http");

// ─── Encrypted Stores ─────────────────────────────────────────────────────────

/** Stores auth tokens (NextAuth session, backend JWT, OAuth tokens) */
const tokenStore = new Store({
  name: "vinexus-auth",
  encryptionKey: "vinexus-auth-enc-key-v1", // TODO: derive from machine ID for production
});

/** Stores saved VM connection credentials */
const credStore = new Store({
  name: "vinexus-vm-creds",
  encryptionKey: "vinexus-vm-creds-enc-key-v1",
});

/** Stores non-sensitive UI preferences (panel sizes, etc.) */
const prefsStore = new Store({
  name: "vinexus-prefs",
});

// ─── IPC Handler Registration ─────────────────────────────────────────────────

function registerAuthHandlers() {
  // ── Token Storage ─────────────────────────────────────────────────────────
  ipcMain.handle("auth:getToken", (_event, key) => {
    try {
      return { value: tokenStore.get(key, null) };
    } catch (err) {
      log.error("auth:getToken error:", err);
      return { error: String(err.message) };
    }
  });

  ipcMain.handle("auth:setToken", (_event, key, value) => {
    try {
      tokenStore.set(key, value);
      return { ok: true };
    } catch (err) {
      log.error("auth:setToken error:", err);
      return { error: String(err.message) };
    }
  });

  ipcMain.handle("auth:clearToken", (_event, key) => {
    try {
      if (key) {
        tokenStore.delete(key);
      } else {
        tokenStore.clear();
      }
      return { ok: true };
    } catch (err) {
      log.error("auth:clearToken error:", err);
      return { error: String(err.message) };
    }
  });

  // ── VM Credentials ────────────────────────────────────────────────────────
  ipcMain.handle("auth:getVmCredentials", (_event) => {
    try {
      const creds = credStore.get("vmCredentials", {});
      return { credentials: creds };
    } catch (err) {
      log.error("auth:getVmCredentials error:", err);
      return { error: String(err.message) };
    }
  });

  ipcMain.handle("auth:saveVmCredentials", (_event, id, creds) => {
    try {
      const all = credStore.get("vmCredentials", {});
      all[id] = creds;
      credStore.set("vmCredentials", all);
      return { ok: true };
    } catch (err) {
      log.error("auth:saveVmCredentials error:", err);
      return { error: String(err.message) };
    }
  });

  ipcMain.handle("auth:deleteVmCredentials", (_event, id) => {
    try {
      const all = credStore.get("vmCredentials", {});
      delete all[id];
      credStore.set("vmCredentials", all);
      return { ok: true };
    } catch (err) {
      log.error("auth:deleteVmCredentials error:", err);
      return { error: String(err.message) };
    }
  });

  // ── UI Preferences ────────────────────────────────────────────────────────
  ipcMain.handle("prefs:get", (_event, key, defaultValue) => {
    try {
      return { value: prefsStore.get(key, defaultValue) };
    } catch (err) {
      log.error("prefs:get error:", err);
      return { value: defaultValue };
    }
  });

  ipcMain.handle("prefs:set", (_event, key, value) => {
    try {
      prefsStore.set(key, value);
      return { ok: true };
    } catch (err) {
      log.error("prefs:set error:", err);
      return { error: String(err.message) };
    }
  });

  // ── Desktop Auth (Electron-only login/register/session) ──────────────────

  /** Helper: POST JSON to a localhost Next.js API route */
  function localPost(path, body) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(body);
      const req = http.request(
        { hostname: "127.0.0.1", port: 3000, path, method: "POST",
          headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } },
        (res) => {
          let data = "";
          res.on("data", (c) => { data += c; });
          res.on("end", () => {
            try { resolve(JSON.parse(data)); } catch { resolve({}); }
          });
        }
      );
      req.on("error", reject);
      req.write(payload);
      req.end();
    });
  }

  ipcMain.handle("auth:desktopLogin", async (_event, { email, password }) => {
    try {
      const result = await localPost("/api/auth/desktop-login", { email, password });
      if (result.user) {
        tokenStore.set("user", result.user);
        return { user: result.user };
      }
      return { error: result.error || "Login failed" };
    } catch (err) {
      log.error("auth:desktopLogin error:", err);
      return { error: String(err.message) };
    }
  });

  ipcMain.handle("auth:desktopRegister", async (_event, { email, name, password }) => {
    try {
      const reg = await localPost("/api/auth/signup", { email, name, password });
      if (reg.error) return { error: reg.error };
      // Auto-login after registration
      const result = await localPost("/api/auth/desktop-login", { email, password });
      if (result.user) {
        tokenStore.set("user", result.user);
        return { user: result.user };
      }
      return { error: "Registration succeeded but login failed — please sign in." };
    } catch (err) {
      log.error("auth:desktopRegister error:", err);
      return { error: String(err.message) };
    }
  });

  ipcMain.handle("auth:getSession", (_event) => {
    try {
      const user = tokenStore.get("user", null);
      return { user };
    } catch (err) {
      log.error("auth:getSession error:", err);
      return { user: null };
    }
  });

  ipcMain.handle("auth:syncPlan", async (_event) => {
    try {
      const user = tokenStore.get("user", null);
      if (!user?.email) return { ok: false };
      const result = await localPost("/api/auth/desktop-plan", { email: user.email });
      if (result.planKey) {
        const updated = { ...user, plan: result.planKey, features: result.features };
        tokenStore.set("user", updated);
        return { ok: true, plan: result.planKey, features: result.features };
      }
      return { ok: false };
    } catch (err) {
      log.error("auth:syncPlan error:", err);
      return { ok: false };
    }
  });

  // ── App Utilities ─────────────────────────────────────────────────────────
  ipcMain.handle("app:getVersion", () => app.getVersion());

  ipcMain.handle("app:openExternal", (_event, url) => {
    // Safety: only allow http/https URLs
    if (/^https?:\/\//.test(url)) {
      shell.openExternal(url);
      return { ok: true };
    }
    return { error: "Invalid URL scheme" };
  });

  log.info("Auth IPC handlers registered");
}

module.exports = { registerAuthHandlers };
