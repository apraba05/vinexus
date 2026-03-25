import { app, BrowserWindow, shell, Menu, nativeTheme } from "electron";
import { autoUpdater } from "electron-updater";
import * as path from "path";

// ─── Constants ─────────────────────────────────────────────
const APP_URL = process.env.VINEXUS_URL || "https://vinexus.dev";
const IS_DEV = !app.isPackaged;
const WINDOW_STATE = { width: 1400, height: 900, x: undefined as number | undefined, y: undefined as number | undefined };

// ─── Force dark mode ───────────────────────────────────────
nativeTheme.themeSource = "dark";

// ─── Main window ───────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: WINDOW_STATE.width,
    height: WINDOW_STATE.height,
    x: WINDOW_STATE.x,
    y: WINDOW_STATE.y,
    minWidth: 900,
    minHeight: 600,
    title: "Vinexus",
    titleBarStyle: "hiddenInset", // macOS frameless with traffic lights
    trafficLightPosition: { x: 14, y: 14 },
    backgroundColor: "#09090b",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Load the app
  if (IS_DEV && process.env.DEV_URL) {
    mainWindow.loadURL(process.env.DEV_URL);
  } else {
    mainWindow.loadURL(APP_URL);
  }

  // Show when ready to avoid white flash
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Save window state on close
  mainWindow.on("resize", saveWindowState);
  mainWindow.on("move", saveWindowState);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function saveWindowState(): void {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  WINDOW_STATE.width = bounds.width;
  WINDOW_STATE.height = bounds.height;
  WINDOW_STATE.x = bounds.x;
  WINDOW_STATE.y = bounds.y;
}

// ─── Application menu ─────────────────────────────────────
function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Vinexus",
      submenu: [
        { role: "about" },
        { type: "separator" },
        {
          label: "Check for Updates…",
          click: () => autoUpdater.checkForUpdatesAndNotify(),
        },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        { type: "separator" },
        { role: "front" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Documentation",
          click: () => shell.openExternal(`${APP_URL}/docs`),
        },
        {
          label: "Report Issue",
          click: () => shell.openExternal("https://github.com/apraba05/vinexus/issues"),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── Auto-update ───────────────────────────────────────────
function setupAutoUpdater(): void {
  if (IS_DEV) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", () => {
    console.log("[AutoUpdater] Update available — downloading...");
  });

  autoUpdater.on("update-downloaded", () => {
    console.log("[AutoUpdater] Update downloaded — will install on quit.");
  });

  autoUpdater.on("error", (err) => {
    console.error("[AutoUpdater] Error:", err.message);
  });

  // Check for updates after a short delay
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(console.error);
  }, 5000);
}

// ─── App lifecycle ─────────────────────────────────────────
app.whenReady().then(() => {
  buildMenu();
  createWindow();
  setupAutoUpdater();

  app.on("activate", () => {
    // macOS: re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ─── Security: prevent new window creation ─────────────────
app.on("web-contents-created", (_event, contents) => {
  contents.on("will-navigate", (event, url) => {
    const parsed = new URL(url);
    const allowed = new URL(APP_URL);
    if (parsed.origin !== allowed.origin) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
});
