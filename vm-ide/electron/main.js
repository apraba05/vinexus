/**
 * electron/main.js
 *
 * Vinexus Desktop — Main Electron Process
 *
 * Responsibilities:
 *  - Create and manage the BrowserWindow
 *  - Enforce single-instance lock
 *  - Spawn and manage child processes: Next.js frontend server + Express backend
 *  - Register the vinexus:// deep-link protocol for OAuth callbacks
 *  - Register all IPC handlers (auth, ssh, pty, updater)
 *  - Persist window state (size/position) via electron-store
 */

const { app, BrowserWindow, ipcMain, shell, protocol, session } = require("electron");
const path = require("path");
const { fork, spawn } = require("child_process");
const log = require("electron-log");
const { autoUpdater } = require("electron-updater");
const Store = require("electron-store");

const menu = require("./menu");
const { registerAuthHandlers, storeUser } = require("./ipc/auth");
const { registerSshHandlers } = require("./ipc/ssh");
const { registerPtyHandlers, cleanupPty } = require("./ipc/pty");

// ─── Logging ──────────────────────────────────────────────────────────────────
log.transports.file.level = "info";
log.transports.console.level = "debug";
log.info("Vinexus Desktop starting", { version: app.getVersion(), pid: process.pid });

// ─── Constants ────────────────────────────────────────────────────────────────
const FRONTEND_PORT = 3000;
const BACKEND_PORT = 4000;
const DEV_MODE = !app.isPackaged;
const APP_URL = `http://localhost:${FRONTEND_PORT}/app`;
const DEEP_LINK_PROTOCOL = "vinexus";

// ─── Electron Store (window state) ────────────────────────────────────────────
const windowStore = new Store({
  name: "vinexus-window-state",
  encryptionKey: undefined, // window state doesn't need encryption
});

// ─── Runtime Config ───────────────────────────────────────────────────────────
// In production, a runtime.env file is bundled alongside server.js.
// It contains DATABASE_URL, NEXTAUTH_SECRET, ADMIN_EMAIL, etc.
// The CI writes this file from GitHub Secrets at build time.
function loadRuntimeConfig() {
  if (DEV_MODE) return; // dev mode uses .env files loaded by Next.js directly
  const fs = require("fs");
  const envPath = path.join(__dirname, "..", "frontend", ".next", "standalone", "runtime.env");
  try {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const eq = line.indexOf("=");
      if (eq < 1) continue;
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim();
      if (key && !process.env[key]) process.env[key] = val;
    }
    log.info("Loaded runtime config from:", envPath);
  } catch {
    log.warn("No runtime.env found — some features may not work. Expected at:", envPath);
  }
}
loadRuntimeConfig();

// ─── Single Instance Lock ─────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  log.info("Another instance is already running — quitting.");
  app.quit();
  process.exit(0);
}

// ─── Deep Link Protocol Registration ─────────────────────────────────────────
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL);
}

// ─── Child Process Handles ────────────────────────────────────────────────────
let frontendProcess = null;
let backendProcess = null;

/**
 * Spawn the Next.js standalone server (frontend).
 * In dev mode, we assume `npm run dev` is already running.
 * In production, we launch the built standalone server.
 */
function startFrontend() {
  if (DEV_MODE) {
    log.info("Dev mode: assuming Next.js dev server is already running on port", FRONTEND_PORT);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // asar: false means __dirname is a real filesystem path — spawn() can reach this directly.
    const serverPath = path.join(__dirname, "..", "frontend", ".next", "standalone", "server.js");
    log.info("Starting Next.js standalone server:", serverPath);

    frontendProcess = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1", // run Electron binary as plain Node.js, not as an Electron app
        PORT: String(FRONTEND_PORT),
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        NEXTAUTH_URL: `http://localhost:${FRONTEND_PORT}`,
        NEXT_PUBLIC_APP_URL: `http://localhost:${FRONTEND_PORT}`,
        AUTH_TRUST_HOST: "1", // Auth.js v5 requires this for non-standard hosts like localhost
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    frontendProcess.stdout.on("data", (data) => {
      const msg = data.toString().trim();
      log.info("[frontend]", msg);
      if (msg.includes("Ready") || msg.includes("started server") || msg.includes(String(FRONTEND_PORT))) {
        resolve();
      }
    });

    frontendProcess.stderr.on("data", (data) => {
      log.warn("[frontend stderr]", data.toString().trim());
    });

    frontendProcess.on("error", (err) => {
      log.error("Frontend process error:", err);
      reject(err);
    });

    frontendProcess.on("exit", (code) => {
      log.info("Frontend process exited with code:", code);
    });

    // Resolve after 8 seconds even if no "Ready" log (some builds don't log it)
    setTimeout(resolve, 8000);
  });
}

/**
 * Spawn the Express backend server.
 * In dev mode, we assume `npm run dev` is running in backend/.
 * In production, we launch the compiled dist/server.js.
 */
function startBackend() {
  if (DEV_MODE) {
    log.info("Dev mode: assuming Express backend is already running on port", BACKEND_PORT);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, "..", "backend", "dist", "server.js");
    log.info("Starting Express backend:", serverPath);

    backendProcess = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1", // run Electron binary as plain Node.js, not as an Electron app
        PORT: String(BACKEND_PORT),
        NODE_ENV: "production",
        FRONTEND_ORIGIN: `http://localhost:${FRONTEND_PORT}`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    backendProcess.stdout.on("data", (data) => {
      const msg = data.toString().trim();
      log.info("[backend]", msg);
      if (msg.includes("listening") || msg.includes(String(BACKEND_PORT))) {
        resolve();
      }
    });

    backendProcess.stderr.on("data", (data) => {
      log.warn("[backend stderr]", data.toString().trim());
    });

    backendProcess.on("error", (err) => {
      log.error("Backend process error:", err);
      reject(err);
    });

    backendProcess.on("exit", (code) => {
      log.info("Backend process exited with code:", code);
    });

    // Resolve after 5 seconds even without log confirmation
    setTimeout(resolve, 5000);
  });
}

// ─── Window State Helpers ─────────────────────────────────────────────────────
function getSavedWindowState() {
  return {
    width: windowStore.get("width", 1440),
    height: windowStore.get("height", 900),
    x: windowStore.get("x", undefined),
    y: windowStore.get("y", undefined),
    maximized: windowStore.get("maximized", true),
  };
}

function saveWindowState(win) {
  if (!win || win.isDestroyed()) return;
  if (win.isMaximized()) {
    windowStore.set("maximized", true);
  } else {
    const bounds = win.getBounds();
    windowStore.set("width", bounds.width);
    windowStore.set("height", bounds.height);
    windowStore.set("x", bounds.x);
    windowStore.set("y", bounds.y);
    windowStore.set("maximized", false);
  }
}

// ─── Main Window ──────────────────────────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  const state = getSavedWindowState();

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 1024,
    minHeight: 700,
    title: "Vinexus",
    backgroundColor: "#0a0a0f",
    // Show traffic lights but let our web title bar handle the visual style
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 14, y: 13 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for preload to use require
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    show: false, // show after ready-to-show to avoid flash
  });

  // Set native menu
  menu.setApplicationMenu(mainWindow);

  // Maximize on first launch or if saved as maximized
  if (state.maximized) {
    mainWindow.maximize();
  }

  // Show window once content is ready (avoids white flash)
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (DEV_MODE) {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  });

  // Persist window state on close
  mainWindow.on("close", function () {
    saveWindowState(this);
    cleanupPty();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Open external links in system browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1")) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Handle navigations:
  //  - /signup → redirect to /login (desktop users already have accounts)
  //  - NextAuth OAuth initiation (/api/auth/signin/google, /github) → open via vinexus.space
  //  - other external URLs → block
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const isLocal = url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1");
    if (isLocal) {
      // Block navigation to /signup — desktop users sign up on the website
      try {
        const parsed = new URL(url);
        if (parsed.pathname === "/signup" || parsed.pathname.startsWith("/signup")) {
          event.preventDefault();
          mainWindow.webContents.loadURL(`http://localhost:${FRONTEND_PORT}/login`);
          return;
        }
        // Intercept OAuth initiation — redirect through vinexus.space instead of localhost
        // so Google/GitHub callback URLs (registered for vinexus.space) work correctly.
        const oauthProviders = ["google", "github"];
        for (const provider of oauthProviders) {
          if (parsed.pathname.startsWith(`/api/auth/signin/${provider}`)) {
            event.preventDefault();
            const webSignInUrl = `https://vinexus.space/api/auth/signin/${provider}?callbackUrl=%2Fdesktop-callback`;
            log.info(`OAuth initiation for ${provider} — opening via vinexus.space:`, webSignInUrl);
            shell.openExternal(webSignInUrl);
            return;
          }
        }
      } catch {}
      return; // allow all other local navigations
    }
    event.preventDefault();
    log.info("Blocked external navigation:", url);
  });

  return mainWindow;
}

// ─── Deep Link Handler ────────────────────────────────────────────────────────
function handleDeepLink(url) {
  log.info("Deep link received:", url);
  if (!mainWindow) return;

  // Focus the window
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();

  // Handle vinexus://auth/callback?user=BASE64_JSON — OAuth flow via vinexus.space
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "auth" && parsed.pathname === "/callback") {
      const encoded = parsed.searchParams.get("user");
      if (encoded) {
        const user = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
        log.info("OAuth deep-link callback — storing user:", user?.email);
        storeUser(user);
        // Navigate the app to the IDE
        mainWindow.loadURL(APP_URL).catch((err) => log.error("Failed to navigate after OAuth:", err));
        return;
      }
    }
  } catch (err) {
    log.warn("Deep link parse error:", err);
  }

  // Fallback: forward the raw URL to the renderer
  mainWindow.webContents.send("auth:deep-link", url);
}

// ─── App Events ───────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  log.info("App ready");

  // Register IPC handlers before creating the window
  registerAuthHandlers();
  registerSshHandlers();
  registerPtyHandlers();

  // Create the window immediately so the user sees the loading screen
  // instead of waiting ~8 s on a blank desktop.
  createWindow();

  // Show the branded loading screen while servers start up
  if (!DEV_MODE) {
    mainWindow.webContents.loadFile(path.join(__dirname, "loading.html"));
  }

  // Start servers (no-op in dev mode).
  // Backend failure is non-fatal — basic IDE features (SSH, terminal, file editing)
  // work via Electron IPC. Only Pro AI/deploy features need the backend.
  await Promise.all([
    startBackend().catch((err) => log.warn("Backend failed to start (non-fatal):", err.message)),
    startFrontend(),
  ]);

  // Navigate to the app once servers are ready
  log.info("Servers ready — navigating to app");
  mainWindow.loadURL(APP_URL).catch((err) => {
    log.error("Failed to load app URL:", err);
    mainWindow.webContents.loadURL(
      `data:text/html,<h2 style="font-family:sans-serif;color:#fff;background:#0a0a0f;padding:40px">Vinexus could not connect to local servers. Please try restarting.</h2>`
    );
  });

  // Auto-updater (only in production)
  if (!DEV_MODE) {
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
});

// Second instance opened — focus existing window and handle deep link
app.on("second-instance", (_event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  // On Windows/Linux, deep links arrive via command line
  const url = commandLine.find((arg) => arg.startsWith(`${DEEP_LINK_PROTOCOL}://`));
  if (url) handleDeepLink(url);
});

// macOS: deep link arrives via open-url event
app.on("open-url", (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

app.on("activate", () => {
  // macOS: re-create window if Dock icon clicked with no windows open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  // On macOS, keep the app running (standard macOS behaviour)
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  log.info("App quitting — cleaning up child processes");
  if (frontendProcess) {
    frontendProcess.kill();
    frontendProcess = null;
  }
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  cleanupPty();
});

// ─── Auto-Updater Events ──────────────────────────────────────────────────────
autoUpdater.on("update-available", (info) => {
  log.info("Update available:", info.version);
  if (mainWindow) {
    mainWindow.webContents.send("updater:update-available", info);
  }
});

autoUpdater.on("update-downloaded", (info) => {
  log.info("Update downloaded:", info.version);
  if (mainWindow) {
    mainWindow.webContents.send("updater:update-downloaded", info);
  }
});

ipcMain.handle("updater:install-and-restart", () => {
  autoUpdater.quitAndInstall();
});
