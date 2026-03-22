import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  // SSH
  sshConnect: (config: any) => ipcRenderer.invoke("ssh:connect", config),
  sshDisconnect: () => ipcRenderer.invoke("ssh:disconnect"),
  listFiles: (dir: string) => ipcRenderer.invoke("ssh:listFiles", dir),
  readFile: (path: string) => ipcRenderer.invoke("ssh:readFile", path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke("ssh:writeFile", path, content),
  exec: (cmd: string) => ipcRenderer.invoke("ssh:exec", cmd),

  // Terminal
  openShell: () => ipcRenderer.invoke("ssh:openShell"),
  sendTerminalInput: (data: string) => ipcRenderer.send("terminal:input", data),
  resizeTerminal: (cols: number, rows: number) => ipcRenderer.send("terminal:resize", cols, rows),
  onTerminalData: (cb: (data: string) => void) => {
    ipcRenderer.on("terminal:data", (_e, data) => cb(data));
  },
  onTerminalClosed: (cb: () => void) => {
    ipcRenderer.on("terminal:closed", () => cb());
  },
});
