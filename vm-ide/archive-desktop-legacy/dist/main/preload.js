"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("api", {
    // SSH
    sshConnect: (config) => electron_1.ipcRenderer.invoke("ssh:connect", config),
    sshDisconnect: () => electron_1.ipcRenderer.invoke("ssh:disconnect"),
    listFiles: (dir) => electron_1.ipcRenderer.invoke("ssh:listFiles", dir),
    readFile: (path) => electron_1.ipcRenderer.invoke("ssh:readFile", path),
    writeFile: (path, content) => electron_1.ipcRenderer.invoke("ssh:writeFile", path, content),
    exec: (cmd) => electron_1.ipcRenderer.invoke("ssh:exec", cmd),
    // Terminal
    openShell: () => electron_1.ipcRenderer.invoke("ssh:openShell"),
    sendTerminalInput: (data) => electron_1.ipcRenderer.send("terminal:input", data),
    resizeTerminal: (cols, rows) => electron_1.ipcRenderer.send("terminal:resize", cols, rows),
    onTerminalData: (cb) => {
        electron_1.ipcRenderer.on("terminal:data", (_e, data) => cb(data));
    },
    onTerminalClosed: (cb) => {
        electron_1.ipcRenderer.on("terminal:closed", () => cb());
    },
});
//# sourceMappingURL=preload.js.map