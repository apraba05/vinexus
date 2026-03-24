/**
 * electron/menu.js
 *
 * Vinexus Desktop — Native Application Menu
 *
 * Builds a VS Code–style IDE menu bar:
 *   Vinexus | File | Edit | View | Terminal | VM | Help
 *
 * All keyboard shortcuts use standard OS conventions.
 */

const { Menu, app, shell, BrowserWindow, ipcMain } = require("electron");

/** Send a command to the focused renderer */
function sendToRenderer(channel, ...args) {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.webContents.send(channel, ...args);
}

function buildTemplate(mainWindow) {
  const isMac = process.platform === "darwin";

  const template = [
    // ── macOS App menu ───────────────────────────────────────────────────────
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { label: `About ${app.name}`, role: "about" },
              { type: "separator" },
              { label: "Preferences…", accelerator: "Cmd+,", click: () => sendToRenderer("menu:openSettings") },
              { type: "separator" },
              { label: "Services", role: "services" },
              { type: "separator" },
              { label: `Hide ${app.name}`, role: "hide" },
              { label: "Hide Others", role: "hideOthers" },
              { label: "Show All", role: "unhide" },
              { type: "separator" },
              { label: `Quit ${app.name}`, role: "quit" },
            ],
          },
        ]
      : []),

    // ── File ─────────────────────────────────────────────────────────────────
    {
      label: "File",
      submenu: [
        {
          label: "New File",
          accelerator: "CmdOrCtrl+N",
          click: () => sendToRenderer("menu:newFile"),
        },
        {
          label: "New Folder",
          accelerator: "CmdOrCtrl+Shift+N",
          click: () => sendToRenderer("menu:newFolder"),
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => sendToRenderer("menu:save"),
        },
        {
          label: "Save All",
          accelerator: "CmdOrCtrl+Alt+S",
          click: () => sendToRenderer("menu:saveAll"),
        },
        { type: "separator" },
        {
          label: "Close Tab",
          accelerator: "CmdOrCtrl+W",
          click: () => sendToRenderer("menu:closeTab"),
        },
        { type: "separator" },
        ...(!isMac
          ? [
              { type: "separator" },
              {
                label: "Preferences",
                accelerator: "Ctrl+,",
                click: () => sendToRenderer("menu:openSettings"),
              },
              { type: "separator" },
              { label: "Quit", role: "quit" },
            ]
          : []),
      ],
    },

    // ── Edit ─────────────────────────────────────────────────────────────────
    {
      label: "Edit",
      submenu: [
        { label: "Undo", role: "undo" },
        { label: "Redo", role: "redo" },
        { type: "separator" },
        { label: "Cut", role: "cut" },
        { label: "Copy", role: "copy" },
        { label: "Paste", role: "paste" },
        { label: "Select All", role: "selectAll" },
        { type: "separator" },
        {
          label: "Find…",
          accelerator: "CmdOrCtrl+F",
          click: () => sendToRenderer("menu:find"),
        },
        {
          label: "Replace…",
          accelerator: "CmdOrCtrl+H",
          click: () => sendToRenderer("menu:replace"),
        },
      ],
    },

    // ── View ─────────────────────────────────────────────────────────────────
    {
      label: "View",
      submenu: [
        {
          label: "Command Palette",
          accelerator: "CmdOrCtrl+P",
          click: () => sendToRenderer("menu:commandPalette"),
        },
        { type: "separator" },
        {
          label: "Toggle File Explorer",
          accelerator: "CmdOrCtrl+B",
          click: () => sendToRenderer("menu:toggleSidebar"),
        },
        {
          label: "Toggle Terminal",
          accelerator: "CmdOrCtrl+`",
          click: () => sendToRenderer("menu:toggleTerminal"),
        },
        {
          label: "Toggle AI Panel",
          accelerator: "CmdOrCtrl+Shift+A",
          click: () => sendToRenderer("menu:toggleAI"),
        },
        { type: "separator" },
        { label: "Reload App", role: "reload" },
        { label: "Force Reload", role: "forceReload" },
        {
          label: "Toggle Dev Tools",
          role: "toggleDevTools",
          visible: !app.isPackaged,
        },
        { type: "separator" },
        { label: "Actual Size", role: "resetZoom" },
        { label: "Zoom In", role: "zoomIn" },
        { label: "Zoom Out", role: "zoomOut" },
        { type: "separator" },
        { label: "Toggle Full Screen", role: "togglefullscreen" },
      ],
    },

    // ── Terminal ──────────────────────────────────────────────────────────────
    {
      label: "Terminal",
      submenu: [
        {
          label: "New Terminal Tab",
          accelerator: "CmdOrCtrl+Shift+`",
          click: () => sendToRenderer("menu:newTerminal"),
        },
        {
          label: "Clear Terminal",
          accelerator: "CmdOrCtrl+K",
          click: () => sendToRenderer("menu:clearTerminal"),
        },
        { type: "separator" },
        {
          label: "Show Terminal",
          accelerator: "CmdOrCtrl+`",
          click: () => sendToRenderer("menu:toggleTerminal"),
        },
      ],
    },

    // ── VM ────────────────────────────────────────────────────────────────────
    {
      label: "VM",
      submenu: [
        {
          label: "New SSH Connection…",
          accelerator: "CmdOrCtrl+Shift+C",
          click: () => sendToRenderer("menu:newConnection"),
        },
        {
          label: "Disconnect Active VM",
          accelerator: "CmdOrCtrl+Shift+D",
          click: () => sendToRenderer("menu:disconnectVM"),
        },
        { type: "separator" },
        {
          label: "Deploy",
          accelerator: "CmdOrCtrl+Shift+P",
          click: () => sendToRenderer("menu:deploy"),
        },
        {
          label: "Run Command…",
          accelerator: "CmdOrCtrl+Shift+R",
          click: () => sendToRenderer("menu:runCommand"),
        },
        { type: "separator" },
        {
          label: "Validate Active File",
          accelerator: "CmdOrCtrl+Shift+V",
          click: () => sendToRenderer("menu:validate"),
        },
      ],
    },

    // ── Help ──────────────────────────────────────────────────────────────────
    {
      label: "Help",
      role: "help",
      submenu: [
        {
          label: "Documentation",
          click: () => shell.openExternal("https://vinexus.space/docs"),
        },
        {
          label: "Report an Issue",
          click: () => shell.openExternal("https://github.com/apraba05/vinexus/issues"),
        },
        { type: "separator" },
        {
          label: "Check for Updates",
          click: () => {
            const { autoUpdater } = require("electron-updater");
            autoUpdater.checkForUpdates();
          },
        },
        ...(!isMac
          ? [
              { type: "separator" },
              { label: "About Vinexus", role: "about" },
            ]
          : []),
      ],
    },
  ];

  return template;
}

/**
 * Build and set the application menu.
 * Call this after creating the BrowserWindow.
 */
function setApplicationMenu(mainWindow) {
  const template = buildTemplate(mainWindow);
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = { setApplicationMenu };
