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

const { ipcMain, app, shell, safeStorage } = require("electron");
const Store = require("electron-store");
const crypto = require("crypto");
const log = require("electron-log");
const http = require("http");

// ─── Key Management via OS Keychain ───────────────────────────────────────────
// Keys are generated randomly on first run, then encrypted with the OS keychain
// (macOS Keychain, Windows DPAPI, Linux libsecret) via safeStorage.
// The encrypted blobs are stored in a plain electron-store file.

/** Plain store that only holds safeStorage-encrypted key blobs */
const keyStore = new Store({ name: "vinexus-keys" });

let tokenStore = null;
let credStore = null;
let prefsStore = null;

function getOrCreateKey(keyName) {
  if (!safeStorage.isEncryptionAvailable()) {
    // OS keychain is unavailable (headless / some Linux environments).
    // Generate a random key per-install stored in plaintext as a best-effort measure.
    // This does NOT provide OS-level protection but avoids a hardcoded/predictable key.
    const fallbackKey = "fallback-raw-" + keyName;
    const existing = keyStore.get(fallbackKey);
    if (existing) return existing;
    const newKey = crypto.randomBytes(32).toString("hex");
    keyStore.set(fallbackKey, newKey);
    log.warn("safeStorage unavailable — storing raw key for:", keyName, "(no OS keychain protection)");
    return newKey;
  }
  const storedBlob = keyStore.get(keyName);
  if (storedBlob) {
    try {
      return safeStorage.decryptString(Buffer.from(storedBlob, "base64"));
    } catch (err) {
      log.warn("Failed to decrypt key blob, generating fresh key:", keyName, err.message);
    }
  }
  // First run: generate a cryptographically random 64-char key, encrypted by OS keychain
  const newKey = crypto.randomBytes(32).toString("hex");
  const encrypted = safeStorage.encryptString(newKey);
  keyStore.set(keyName, encrypted.toString("base64"));
  log.info("Generated and stored new encryption key for:", keyName);
  return newKey;
}

/**
 * Validate a store is readable with the current key.
 * If decryption fails (old encryption key from a previous install), clear the file so
 * the store starts fresh. Users will need to log in again but the app won't crash.
 */
function validateStore(store, name) {
  try {
    store.get("__probe__", null);
  } catch (err) {
    log.warn(`Store "${name}" appears corrupted or was encrypted with an old key — clearing. Users must re-login.`, err.message);
    try { store.clear(); } catch (clearErr) { log.error(`Failed to clear store "${name}":`, clearErr.message); }
  }
}

/**
 * Create an electron-store with the given options.
 * If construction fails (e.g. existing file was written by an older unencrypted
 * version and can't be decrypted), delete the corrupted file and try once more.
 */
function safeStore(options) {
  try {
    return new Store(options);
  } catch (err) {
    log.warn(`Store "${options.name}" failed to open (likely unencrypted legacy file) — clearing and retrying:`, err.message);
    try {
      // electron-store stores files in app.getPath("userData")
      const { app } = require("electron");
      const fs = require("fs");
      const storeFile = require("path").join(app.getPath("userData"), `${options.name}.json`);
      if (fs.existsSync(storeFile)) fs.unlinkSync(storeFile);
    } catch (delErr) {
      log.error("Failed to delete legacy store file:", delErr.message);
    }
    return new Store(options);
  }
}

/** Initialize stores once, after app is ready (safeStorage requires app ready) */
function initStores() {
  if (tokenStore) return;
  const authKey = getOrCreateKey("auth-enc-key");
  const credsKey = getOrCreateKey("creds-enc-key");
  tokenStore = safeStore({ name: "vinexus-auth", encryptionKey: authKey });
  credStore  = safeStore({ name: "vinexus-vm-creds", encryptionKey: credsKey });
  prefsStore = safeStore({ name: "vinexus-prefs" });
  // Validate: if stores were encrypted with old keys, clear them gracefully
  validateStore(tokenStore, "vinexus-auth");
  validateStore(credStore, "vinexus-vm-creds");
  log.info("Encrypted stores initialized via OS keychain");
}

// ─── IPC Handler Registration ─────────────────────────────────────────────────

function registerAuthHandlers() {
  initStores();

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
            const statusCode = res.statusCode || 500;
            let parsed = {};
            try {
              parsed = data ? JSON.parse(data) : {};
            } catch {
              parsed = {
                error: statusCode >= 500
                  ? "Desktop auth server returned an invalid response"
                  : `Request failed with status ${statusCode}`,
              };
            }
            if (statusCode >= 400 && !parsed.error) {
              parsed.error = `Request failed with status ${statusCode}`;
            }
            resolve(parsed);
          });
        }
      );
      req.setTimeout(10000, () => {
        req.destroy(new Error(`Request to ${path} timed out after 10s`));
      });
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
  ipcMain.handle("auth:logout", () => {
    try {
      tokenStore.clear();
      credStore.clear();
      return { ok: true };
    } catch (err) {
      log.error("auth:logout error:", err);
      return { error: String(err.message) };
    }
  });

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

/**
 * Store a user object directly into the token store.
 * Called from main.js when a vinexus:// deep-link OAuth callback arrives.
 */
function storeUser(user) {
  initStores();
  try {
    tokenStore.set("user", user);
    log.info("OAuth user stored via deep-link:", user?.email);
  } catch (err) {
    log.error("storeUser error:", err);
  }
}

module.exports = { registerAuthHandlers, storeUser };
