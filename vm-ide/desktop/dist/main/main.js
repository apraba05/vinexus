"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const ssh_1 = require("./ssh");
// ─── Constants ─────────────────────────────────────────────
const IS_DEV = process.argv.includes("--dev");
// ─── Force dark mode ───────────────────────────────────────
electron_1.nativeTheme.themeSource = "dark";
// ─── Main window ───────────────────────────────────────────
let mainWindow = null;
const sshManager = new ssh_1.SSHManager();
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
    }
    else {
        mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
    }
    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
        mainWindow?.focus();
    });
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("http"))
            electron_1.shell.openExternal(url);
        return { action: "deny" };
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
        sshManager.disconnect();
    });
}
// ─── IPC Handlers ──────────────────────────────────────────
// SSH connect
electron_1.ipcMain.handle("ssh:connect", async (_event, config) => {
    try {
        await sshManager.connect(config);
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
});
// SSH disconnect
electron_1.ipcMain.handle("ssh:disconnect", async () => {
    sshManager.disconnect();
    return { success: true };
});
// List files via SFTP
electron_1.ipcMain.handle("ssh:listFiles", async (_event, dirPath) => {
    try {
        const files = await sshManager.listFiles(dirPath);
        return { success: true, files };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
});
// Read file via SFTP
electron_1.ipcMain.handle("ssh:readFile", async (_event, filePath) => {
    try {
        const content = await sshManager.readFile(filePath);
        return { success: true, content };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
});
// Write file via SFTP
electron_1.ipcMain.handle("ssh:writeFile", async (_event, filePath, content) => {
    try {
        await sshManager.writeFile(filePath, content);
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
});
// Execute command
electron_1.ipcMain.handle("ssh:exec", async (_event, command) => {
    try {
        const output = await sshManager.exec(command);
        return { success: true, output };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
});
// Shell (interactive terminal)
electron_1.ipcMain.handle("ssh:openShell", async (event) => {
    try {
        sshManager.openShell((data) => {
            mainWindow?.webContents.send("terminal:data", data);
        }, () => {
            mainWindow?.webContents.send("terminal:closed");
        });
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
});
electron_1.ipcMain.on("terminal:input", (_event, data) => {
    sshManager.writeToShell(data);
});
electron_1.ipcMain.on("terminal:resize", (_event, cols, rows) => {
    sshManager.resizeShell(cols, rows);
});
// ─── Application menu ─────────────────────────────────────
function buildMenu() {
    const template = [
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
    electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(template));
}
// ─── App lifecycle ─────────────────────────────────────────
electron_1.app.whenReady().then(() => {
    buildMenu();
    createWindow();
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on("window-all-closed", () => {
    sshManager.disconnect();
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
//# sourceMappingURL=main.js.map