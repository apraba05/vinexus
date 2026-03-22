import React, { useState, useEffect, useRef, useCallback } from "react";
import type { FileEntry } from "./types";

/* ─── Monaco lazy loader ─── */
let monacoRef: typeof import("monaco-editor") | null = null;
async function getMonaco() {
  if (!monacoRef) {
    monacoRef = await import("monaco-editor");
    monacoRef.editor.defineTheme("infranexus", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "c084fc" },
        { token: "string", foreground: "fbbf24" },
        { token: "number", foreground: "f59e0b" },
        { token: "comment", foreground: "52525b" },
        { token: "type", foreground: "818cf8" },
        { token: "function", foreground: "a855f7" },
      ],
      colors: {
        "editor.background": "#09090b",
        "editor.foreground": "#a1a1aa",
        "editorCursor.foreground": "#a855f7",
        "editor.lineHighlightBackground": "#0e0e12",
        "editor.selectionBackground": "#a855f733",
        "editorLineNumber.foreground": "#2e2e35",
        "editorLineNumber.activeForeground": "#52525b",
        "editorWidget.background": "#121216",
        "editorWidget.border": "#1e1e24",
        "input.background": "#151519",
        "input.border": "#1e1e24",
      },
    });
  }
  return monacoRef;
}

/* ─── App ─── */
export default function App() {
  const [connected, setConnected] = useState(false);
  const [showConnect, setShowConnect] = useState(true);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentDir, setCurrentDir] = useState("/home");
  const [openFile, setOpenFile] = useState<{ path: string; name: string; content: string } | null>(null);
  const [modified, setModified] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  const [host, setHost] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<any>(null);
  const xtermRef = useRef<any>(null);

  // ─── Connect ───────────────────────────
  const handleConnect = async (config: any) => {
    setStatus("Connecting...");
    const result = await window.api.sshConnect(config);
    if (result.success) {
      setConnected(true);
      setShowConnect(false);
      setHost(`${config.username}@${config.host}`);
      setStatus(`Connected to ${config.host}`);
      // load files
      const homeDir = `/home/${config.username}`;
      setCurrentDir(homeDir);
      const filesRes = await window.api.listFiles(homeDir);
      if (filesRes.success && filesRes.files) setFiles(filesRes.files);
      // open shell
      await window.api.openShell();
      return { success: true };
    } else {
      setStatus("Connection failed");
      return { success: false, error: result.error };
    }
  };

  // ─── Navigate directory ────────────────
  const navigateDir = async (dirPath: string) => {
    const res = await window.api.listFiles(dirPath);
    if (res.success && res.files) {
      setFiles(res.files);
      setCurrentDir(dirPath);
    }
  };

  // ─── Open file ─────────────────────────
  const handleOpenFile = async (file: FileEntry) => {
    if (file.isDir) {
      navigateDir(file.path);
      return;
    }
    const res = await window.api.readFile(file.path);
    if (res.success && res.content !== undefined) {
      setOpenFile({ path: file.path, name: file.name, content: res.content });
      setModified(false);
    }
  };

  // ─── Save file ─────────────────────────
  const handleSave = useCallback(async () => {
    if (!openFile || !monacoEditorRef.current) return;
    const content = monacoEditorRef.current.getValue();
    const res = await window.api.writeFile(openFile.path, content);
    if (res.success) {
      setModified(false);
      setStatus(`Saved ${openFile.name}`);
    }
  }, [openFile]);

  // ─── Keyboard shortcut ─────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  // ─── Monaco editor ─────────────────────
  useEffect(() => {
    if (!editorRef.current || !openFile) return;
    let disposed = false;

    (async () => {
      const monaco = await getMonaco();
      if (disposed) return;

      // Dispose previous
      if (monacoEditorRef.current) monacoEditorRef.current.dispose();

      const ext = openFile.name.split(".").pop() || "";
      const langMap: Record<string, string> = {
        ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
        py: "python", rs: "rust", go: "go", java: "java", c: "c", cpp: "cpp",
        css: "css", html: "html", json: "json", md: "markdown", yml: "yaml", yaml: "yaml",
        sh: "shell", bash: "shell", sql: "sql", xml: "xml", toml: "ini",
      };

      const editor = monaco.editor.create(editorRef.current!, {
        value: openFile.content,
        language: langMap[ext] || "plaintext",
        theme: "infranexus",
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
        fontLigatures: true,
        minimap: { enabled: true, scale: 1 },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        padding: { top: 12 },
        renderLineHighlight: "gutter",
        lineNumbers: "on",
        automaticLayout: true,
      });

      editor.onDidChangeModelContent(() => setModified(true));
      monacoEditorRef.current = editor;
    })();

    return () => { disposed = true; };
  }, [openFile?.path]);

  // ─── Terminal ──────────────────────────
  useEffect(() => {
    if (!termRef.current || !connected) return;
    let disposed = false;

    (async () => {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      if (disposed) return;

      const term = new Terminal({
        theme: {
          background: "#08080a",
          foreground: "#a1a1aa",
          cursor: "#a855f7",
          cursorAccent: "#09090b",
          selectionBackground: "#a855f733",
          black: "#09090b",
          red: "#ef4444",
          green: "#22c55e",
          yellow: "#f59e0b",
          blue: "#818cf8",
          magenta: "#a855f7",
          cyan: "#c084fc",
          white: "#a1a1aa",
          brightBlack: "#52525b",
          brightRed: "#f87171",
          brightGreen: "#4ade80",
          brightYellow: "#fbbf24",
          brightBlue: "#a5b4fc",
          brightMagenta: "#c084fc",
          brightCyan: "#e9d5ff",
          brightWhite: "#fafafa",
        },
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        cursorBlink: true,
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(termRef.current!);
      fitAddon.fit();

      window.api.resizeTerminal(term.cols, term.rows);

      term.onData((data) => window.api.sendTerminalInput(data));
      term.onResize(({ cols, rows }) => window.api.resizeTerminal(cols, rows));

      window.api.onTerminalData((data) => term.write(data));
      window.api.onTerminalClosed(() => term.write("\r\n[Connection closed]\r\n"));

      xtermRef.current = { term, fitAddon };

      const ro = new ResizeObserver(() => fitAddon.fit());
      ro.observe(termRef.current!);

      return () => ro.disconnect();
    })();

    return () => { disposed = true; };
  }, [connected]);

  // ─── Go up ─────────────────────────────
  const goUp = () => {
    const parent = currentDir.split("/").slice(0, -1).join("/") || "/";
    navigateDir(parent);
  };

  return (
    <div className="ide-root">
      {/* Title bar (drag region) */}
      <div className="title-bar">
        <span className="title-bar-text">InfraNexus — {connected ? host : "Not Connected"}</span>
      </div>

      <div className="ide-body">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <span className="sidebar-title">Explorer</span>
            {connected && (
              <button
                onClick={() => { window.api.sshDisconnect(); setConnected(false); setShowConnect(true); setFiles([]); setOpenFile(null); setStatus("Disconnected"); }}
                style={{ background: "none", border: "none", color: "#ef4444", fontSize: 11, cursor: "pointer", fontFamily: "var(--font)" }}
              >
                Disconnect
              </button>
            )}
          </div>

          {connected ? (
            <div className="sidebar-files">
              {currentDir !== "/" && (
                <button className="file-item dir" onClick={goUp}>
                  <span className="file-icon">↩</span>
                  <span>..</span>
                </button>
              )}
              {files.map((f) => (
                <button
                  key={f.path}
                  className={`file-item ${f.isDir ? "dir" : ""} ${openFile?.path === f.path ? "active" : ""}`}
                  onClick={() => handleOpenFile(f)}
                >
                  <span className="file-icon">{f.isDir ? "📁" : "📄"}</span>
                  <span>{f.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 20 }}>
              <p style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center" }}>
                Connect to a VM to browse files
              </p>
              <button
                onClick={() => setShowConnect(true)}
                style={{
                  padding: "8px 18px", background: "var(--accent)", color: "#fafafa",
                  border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                Connect
              </button>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="main-pane">
          {openFile ? (
            <>
              {/* Tab bar */}
              <div className="tab-bar">
                <button className="tab active">
                  <span>{modified ? "● " : ""}{openFile.name}</span>
                  <button className="tab-close" onClick={() => { setOpenFile(null); setModified(false); }}>×</button>
                </button>
              </div>
              {/* Editor */}
              <div className="editor-area" ref={editorRef} />
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <p className="empty-title">{connected ? "Open a file to edit" : "No active connection"}</p>
              <p className="empty-desc">
                {connected
                  ? "Select a file from the sidebar to start editing"
                  : "Connect to a remote VM to access your files and terminal"}
              </p>
            </div>
          )}

          {/* Terminal */}
          <div className="terminal-panel">
            <div className="terminal-header">
              <button className="terminal-tab active">Terminal</button>
            </div>
            <div className="terminal-body" ref={termRef} />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="status-bar">
        <span className="status-item">
          <span className={`status-dot ${connected ? "connected" : "disconnected"}`} />
          {status}
        </span>
        {openFile && (
          <span className="status-item" style={{ marginLeft: "auto", color: "var(--text-dim)" }}>
            {openFile.path}
          </span>
        )}
      </div>

      {/* Connect modal */}
      {showConnect && <ConnectModal onConnect={handleConnect} onClose={() => connected && setShowConnect(false)} />}
    </div>
  );
}

/* ─── Connect Modal ─── */
function ConnectModal({ onConnect, onClose }: { onConnect: (c: any) => Promise<{ success: boolean; error?: string }>; onClose: () => void }) {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("22");
  const [username, setUsername] = useState("");
  const [authMethod, setAuthMethod] = useState<"key" | "password">("key");
  const [keyPath, setKeyPath] = useState("~/.ssh/id_rsa");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await onConnect({
      host,
      port: parseInt(port, 10),
      username,
      authMethod,
      privateKeyPath: authMethod === "key" ? keyPath : undefined,
      password: authMethod === "password" ? password : undefined,
    });
    setLoading(false);
    if (!result.success) setError(result.error || "Connection failed");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">SSH Connection</h2>
        <p className="modal-sub">Connect to your remote VM</p>

        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Hostname / IP</label>
              <input className="form-input" value={host} onChange={(e) => setHost(e.target.value)} placeholder="ec2-xx-xx.compute.amazonaws.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Port</label>
              <input className="form-input" type="number" value={port} onChange={(e) => setPort(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ubuntu" required />
          </div>

          <div className="form-group">
            <label className="form-label">Auth Method</label>
            <select className="form-select" value={authMethod} onChange={(e) => setAuthMethod(e.target.value as any)}>
              <option value="key">SSH Key</option>
              <option value="password">Password</option>
            </select>
          </div>

          {authMethod === "key" ? (
            <div className="form-group">
              <label className="form-label">Private Key Path</label>
              <input className="form-input" value={keyPath} onChange={(e) => setKeyPath(e.target.value)} placeholder="~/.ssh/id_rsa" />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}

          <button className="btn-connect" type="submit" disabled={loading || !host || !username}>
            {loading ? "Connecting…" : "→ Connect"}
          </button>

          {error && <div className="error-msg">{error}</div>}
        </form>
      </div>
    </div>
  );
}
