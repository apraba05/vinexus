/**
 * lib/electron.ts
 *
 * Vinexus Desktop — Electron Bridge
 *
 * Detects whether the app is running in Electron and provides
 * a unified API that works in both Electron (desktop) and browser (web).
 *
 * Usage:
 *   import { isElectron, electronAuth, electronSsh } from "@/lib/electron";
 *
 *   if (isElectron()) {
 *     const token = await electronAuth.getToken("session");
 *   }
 */

/** Returns true when running inside Electron desktop app */
export function isElectron(): boolean {
  return typeof window !== "undefined" && "electronAPI" in window;
}

/** Type-safe accessor for window.electronAPI */
function api() {
  if (typeof window === "undefined") return null;
  return (window as any).electronAPI ?? null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const electronAuth = {
  getToken: async (key: string): Promise<string | null> => {
    const a = api();
    if (!a) return null;
    const res = await a.auth.getToken(key);
    return res?.value ?? null;
  },
  setToken: async (key: string, value: string): Promise<void> => {
    const a = api();
    if (!a) return;
    await a.auth.setToken(key, value);
  },
  clearToken: async (key?: string): Promise<void> => {
    const a = api();
    if (!a) return;
    await a.auth.clearToken(key ?? null);
  },
  getVmCredentials: async (): Promise<Record<string, any>> => {
    const a = api();
    if (!a) return {};
    const res = await a.auth.getVmCredentials();
    return res?.credentials ?? {};
  },
  saveVmCredentials: async (id: string, creds: any): Promise<void> => {
    const a = api();
    if (!a) return;
    await a.auth.saveVmCredentials(id, creds);
  },
  deleteVmCredentials: async (id: string): Promise<void> => {
    const a = api();
    if (!a) return;
    await a.auth.deleteVmCredentials(id);
  },
  onDeepLink: (callback: (url: string) => void): (() => void) => {
    const a = api();
    if (!a) return () => {};
    return a.auth.onDeepLink(callback);
  },
};

// ─── SSH ──────────────────────────────────────────────────────────────────────
export interface SshConnectParams {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
  authMethod?: "password" | "privateKey" | "awsSsm";
  label?: string;
}

export interface SshConnectResult {
  sessionId?: string;
  host?: string;
  username?: string;
  port?: number;
  error?: string;
}

export const electronSsh = {
  connect: async (params: SshConnectParams): Promise<SshConnectResult> => {
    const a = api();
    if (!a) return { error: "Not running in Electron" };
    return a.ssh.connect(params);
  },
  disconnect: async (sessionId: string): Promise<void> => {
    const a = api();
    if (!a) return;
    await a.ssh.disconnect(sessionId);
  },
  exec: async (sessionId: string, command: string) => {
    const a = api();
    if (!a) return { error: "Not running in Electron" };
    return a.ssh.exec(sessionId, command);
  },
  readdir: async (sessionId: string, remotePath: string) => {
    const a = api();
    if (!a) return { error: "Not running in Electron" };
    return a.ssh.readdir(sessionId, remotePath);
  },
  readFile: async (sessionId: string, remotePath: string) => {
    const a = api();
    if (!a) return { error: "Not running in Electron" };
    return a.ssh.readFile(sessionId, remotePath);
  },
  writeFile: async (sessionId: string, remotePath: string, content: string) => {
    const a = api();
    if (!a) return { error: "Not running in Electron" };
    return a.ssh.writeFile(sessionId, remotePath, content);
  },
  mkdir: async (sessionId: string, remotePath: string) => {
    const a = api();
    if (!a) return { error: "Not running in Electron" };
    return a.ssh.mkdir(sessionId, remotePath);
  },
  rename: async (sessionId: string, oldPath: string, newPath: string) => {
    const a = api();
    if (!a) return { error: "Not running in Electron" };
    return a.ssh.rename(sessionId, oldPath, newPath);
  },
  delete: async (sessionId: string, remotePath: string) => {
    const a = api();
    if (!a) return { error: "Not running in Electron" };
    return a.ssh.delete(sessionId, remotePath);
  },
  getSessions: async () => {
    const a = api();
    if (!a) return {};
    return a.ssh.getSessions();
  },
  onStatusChange: (callback: (sessions: Record<string, any>) => void): (() => void) => {
    const a = api();
    if (!a) return () => {};
    return a.ssh.onStatusChange(callback);
  },
};

// ─── PTY ─────────────────────────────────────────────────────────────────────
export const electronPty = {
  create: async (sessionId: string | null, cols: number, rows: number): Promise<{ ptyId?: string; error?: string }> => {
    const a = api();
    if (!a) return { error: "Not running in Electron" };
    return a.pty.create(sessionId, cols, rows);
  },
  write: (ptyId: string, data: string): void => {
    const a = api();
    if (!a) return;
    a.pty.write(ptyId, data);
  },
  resize: (ptyId: string, cols: number, rows: number): void => {
    const a = api();
    if (!a) return;
    a.pty.resize(ptyId, cols, rows);
  },
  destroy: async (ptyId: string): Promise<void> => {
    const a = api();
    if (!a) return;
    await a.pty.destroy(ptyId);
  },
  onData: (callback: (ptyId: string, data: string) => void): (() => void) => {
    const a = api();
    if (!a) return () => {};
    return a.pty.onData(callback);
  },
  onExit: (callback: (ptyId: string, code: number, signal: string) => void): (() => void) => {
    const a = api();
    if (!a) return () => {};
    return a.pty.onExit(callback);
  },
};

// ─── Prefs ────────────────────────────────────────────────────────────────────
export const electronPrefs = {
  get: async <T = any>(key: string, defaultValue?: T): Promise<T> => {
    const a = api();
    if (!a) return defaultValue as T;
    const res = await a.prefs.get(key, defaultValue);
    return res?.value ?? defaultValue;
  },
  set: async (key: string, value: any): Promise<void> => {
    const a = api();
    if (!a) return;
    await a.prefs.set(key, value);
  },
};
