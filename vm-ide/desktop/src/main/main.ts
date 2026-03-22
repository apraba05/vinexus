import { app, BrowserWindow, ipcMain, shell, Menu, nativeTheme } from "electron";
import { autoUpdater } from "electron-updater";
import * as path from "path";
import { SSHManager } from "./ssh";

// ─── Constants ─────────────────────────────────────────────
const IS_DEV = process.argv.includes("--dev");

// ─── Force dark mode ───────────────────────────────────────
nativeTheme.themeSource = "dark";

// ─── Main window ───────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;
const sshManager = new SSHManager();

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "InfraNexus",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 14, y: 14 },
    backgroundColor: "#09090b",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for ssh2 via IPC
    },
  });

  // Load renderer
  if (IS_DEV) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    sshManager.disconnect();
  });
}

// ─── IPC Handlers ──────────────────────────────────────────

// SSH connect
ipcMain.handle("ssh:connect", async (_event, config: {
  host: string;
  port: number;
  username: string;
  authMethod: "key" | "password";
  privateKeyPath?: string;
  password?: string;
}) => {
  try {
    await sshManager.connect(config);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// SSH disconnect
ipcMain.handle("ssh:disconnect", async () => {
  sshManager.disconnect();
  return { success: true };
});

// List files via SFTP
ipcMain.handle("ssh:listFiles", async (_event, dirPath: string) => {
  try {
    const files = await sshManager.listFiles(dirPath);
    return { success: true, files };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Read file via SFTP
ipcMain.handle("ssh:readFile", async (_event, filePath: string) => {
  try {
    const content = await sshManager.readFile(filePath);
    return { success: true, content };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Write file via SFTP
ipcMain.handle("ssh:writeFile", async (_event, filePath: string, content: string) => {
  try {
    await sshManager.writeFile(filePath, content);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Execute command
ipcMain.handle("ssh:exec", async (_event, command: string) => {
  try {
    const output = await sshManager.exec(command);
    return { success: true, output };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Shell (interactive terminal)
ipcMain.handle("ssh:openShell", async (event) => {
  try {
    sshManager.openShell(
      (data: string) => {
        mainWindow?.webContents.send("terminal:data", data);
      },
      () => {
        mainWindow?.webContents.send("terminal:closed");
      }
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.on("terminal:input", (_event, data: string) => {
  sshManager.writeToShell(data);
});

ipcMain.on("terminal:resize", (_event, cols: number, rows: number) => {
  sshManager.resizeShell(cols, rows);
});

// ─── Application menu ─────────────────────────────────────
function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "InfraNexus",
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" }, { role: "redo" },
        { type: "separator" },
        { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" }, { role: "forceReload" }, { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "zoom" }, { type: "separator" }, { role: "front" }],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── App lifecycle ─────────────────────────────────────────
app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  sshManager.disconnect();
  if (process.platform !== "darwin") app.quit();
});
