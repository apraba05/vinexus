/* ─── Global types for the preload API ─── */
export {};

declare global {
  interface Window {
    api: {
      sshConnect: (config: {
        host: string;
        port: number;
        username: string;
        authMethod: "key" | "password";
        privateKeyPath?: string;
        password?: string;
      }) => Promise<{ success: boolean; error?: string }>;
      sshDisconnect: () => Promise<{ success: boolean }>;
      listFiles: (dir: string) => Promise<{ success: boolean; files?: FileEntry[]; error?: string }>;
      readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
      exec: (cmd: string) => Promise<{ success: boolean; output?: string; error?: string }>;
      openShell: () => Promise<{ success: boolean; error?: string }>;
      sendTerminalInput: (data: string) => void;
      resizeTerminal: (cols: number, rows: number) => void;
      onTerminalData: (cb: (data: string) => void) => void;
      onTerminalClosed: (cb: () => void) => void;
    };
  }
}

export interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
}
