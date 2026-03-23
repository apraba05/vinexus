"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import SshBar, { VmSession } from "@/components/SshBar";
import FileTree from "@/components/FileTree";
import Editor from "@/components/Editor";
import Toolbar from "@/components/Toolbar";
import ToastContainer from "@/components/ToastContainer";
import CommandBar from "@/components/CommandBar";
import BottomPanelTabs, { BottomTab } from "@/components/BottomPanelTabs";
import DeployPanel from "@/components/DeployPanel";
import DiffView from "@/components/DiffView";
import AIInsightsPanel from "@/components/AIInsightsPanel";
import AIChatPanel from "@/components/AIChatPanel";
import ValidationBadge from "@/components/ValidationBadge";
import ErrorBoundary from "@/components/ErrorBoundary";
import StatusBar from "@/components/StatusBar";
import UpgradeBanner from "@/components/UpgradeBanner";
import ProFeature from "@/components/ProFeature";
import { useToast } from "@/lib/useToast";
import { useCommands } from "@/hooks/useCommands";
import { useDeployment } from "@/hooks/useDeployment";
import { useProjectConfig } from "@/hooks/useProjectConfig";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  readFile,
  writeFile,
  diffFile,
  mkdir,
  CommandResult,
  explainFile,
  diagnoseFailure,
  validateFile,
  AIExplanation,
  AIAnalysis,
  ValidationReport,
} from "@/lib/api";
import { normalizePath, joinPath } from "@/lib/pathUtils";
import { isElectron, electronSsh } from "@/lib/electron";

import LoginScreen from "@/components/LoginScreen";
import SearchPanel from "@/components/SearchPanel";
import GitPanel from "@/components/GitPanel";
const TerminalPanel = dynamic(() => import("@/components/Terminal"), { ssr: false });

interface OpenFile {
  path: string;
  content: string;
  dirty: boolean;
}

interface AppUser {
  id: string;
  email: string;
  name: string;
  plan: string;
}


/* ═══════════════════════════════════════════════════════════
   DOWNLOAD PAGE
   ═══════════════════════════════════════════════════════════ */
function DownloadPage() {
  return (
    <div className="dot-grid" style={dl.page}>
      <NavBar />
      <div style={dl.center}>
        <div style={dl.iconWrap}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <h1 style={dl.heading}>Download Vinexus Desktop</h1>
        <p style={dl.sub}>
          Vinexus runs as a native desktop app for the best performance, security, and direct SSH access.
        </p>
        <div style={dl.btns}>
          <a href="#" style={dl.primaryBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" /></svg>
            macOS
          </a>
          <a href="#" style={dl.secondaryBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" /></svg>
            Windows
          </a>
        </div>
        <p style={dl.meta}>macOS 12+ · Windows 10+ · ARM & x86_64</p>
        <div style={dl.features}>
          {[
            { icon: "⚡", title: "Native performance", desc: "Direct SSH tunnels, no browser overhead" },
            { icon: "🔒", title: "End-to-end encrypted", desc: "Private keys never leave your machine" },
            { icon: "🖥️", title: "Full IDE experience", desc: "Monaco editor, terminal, file tree, deploy" },
          ].map((f) => (
            <div key={f.title} style={dl.featureCard}>
              <span style={dl.featureIcon}>{f.icon}</span>
              <div>
                <div style={dl.featureTitle}>{f.title}</div>
                <div style={dl.featureDesc}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <Link href="/dashboard" style={dl.backLink}>← Back to Dashboard</Link>
      </div>
    </div>
  );
}

const dl: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", position: "relative" },
  center: { position: "relative", maxWidth: 560, margin: "0 auto", padding: "80px 24px 80px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" },
  iconWrap: { width: 72, height: 72, borderRadius: 18, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28, boxShadow: "0 8px 24px rgba(0,83,219,0.25)" },
  heading: { fontSize: 28, fontWeight: 700, color: "var(--text-bright)", letterSpacing: "-0.025em", margin: "0 0 10px" },
  sub: { fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, maxWidth: 420, margin: "0 0 28px" },
  btns: { display: "flex", gap: 10, flexWrap: "wrap" as const, justifyContent: "center", marginBottom: 10 },
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", background: "var(--accent)", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" },
  secondaryBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", background: "var(--bg-elevated)", color: "var(--text-primary)", borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: "none", border: "1px solid var(--border)" },
  meta: { fontSize: 11, color: "var(--text-muted)", marginBottom: 40 },
  features: { display: "flex", flexDirection: "column" as const, gap: 12, width: "100%", marginBottom: 36 },
  featureCard: { display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, textAlign: "left" as const },
  featureIcon: { fontSize: 22, flexShrink: 0 },
  featureTitle: { fontSize: 13, fontWeight: 600, color: "var(--text-bright)", marginBottom: 2 },
  featureDesc: { fontSize: 12, color: "var(--text-secondary)" },
  backLink: { fontSize: 13, color: "var(--accent)", textDecoration: "none", fontWeight: 500 },
};

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════ */
export default function AppPage() {
  const [electron, setElectron] = useState(false);
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);

  // After login (or on mount if already logged in), keep plan in sync.
  // No dependency on `user` — uses functional setUser to avoid stale closure.
  const syncPlan = useCallback(async () => {
    const ea = (window as any).electronAPI;
    if (!ea) return;
    try {
      const result = await ea.auth.syncPlan();
      if (result?.ok) {
        setUser((u) => u ? { ...u, plan: result.plan ?? u.plan } : u);
      }
    } catch { /* server may still be starting */ }
  }, []); // stable — uses functional update, no external deps

  useEffect(() => {
    const isEl = isElectron();
    setElectron(isEl);
    if (isEl) {
      const ea = (window as any).electronAPI;
      ea?.auth.getSession().then((res: any) => {
        if (res?.user) setUser(res.user);
        setChecked(true);
      }).catch(() => setChecked(true));
    } else {
      setChecked(true);
    }
  }, []);

  // Poll plan every 5 minutes while app is open
  useEffect(() => {
    if (!electron || !user) return;
    // Initial sync after login
    syncPlan();
    const interval = setInterval(syncPlan, 5 * 60 * 1000);
    // Sync on window focus (user may have just paid in a browser tab)
    window.addEventListener("focus", syncPlan);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", syncPlan);
    };
  }, [electron, user, syncPlan]);

  // Handle ?upgrade=success — sync plan immediately so UI reflects new plan
  useEffect(() => {
    if (!electron) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") === "success") {
      syncPlan();
      // Clean the query param without reloading
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [electron, syncPlan]);

  if (!checked) return null;
  if (!electron) return <DownloadPage />;
  if (!user) return <LoginScreen onLogin={(u) => { setUser(u); }} />;
  return <IDEView user={user} onLogout={() => setUser(null)} />;
}

/* ═══════════════════════════════════════════════════════════
   IDE VIEW
   ═══════════════════════════════════════════════════════════ */
function IDEView({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [vmSessions, setVmSessions] = useState<VmSession[]>([]);
  const [activeVmSessionId, setActiveVmSessionId] = useState<string | null>(null);
  const [vmConnecting, setVmConnecting] = useState(false);

  useEffect(() => {
    if (!isElectron()) return;
    const unsubscribe = electronSsh.onStatusChange((statusMap) => {
      const list: VmSession[] = Object.values(statusMap).map((s: any) => ({
        id: s.id, label: s.label, host: s.host, username: s.username, port: s.port, status: s.status,
      }));
      setVmSessions(list);
    });
    // Restore session from localStorage only if it still exists in Electron's pool
    electronSsh.getSessions().then((existing: any) => {
      if (existing && typeof existing === "object") {
        const list: VmSession[] = Object.values(existing).map((s: any) => ({
          id: s.id, label: s.label, host: s.host, username: s.username, port: s.port, status: s.status,
        }));
        setVmSessions(list);
        if (list.length > 0) {
          const savedId = typeof window !== "undefined" ? localStorage.getItem("vm-ide-session") : null;
          const match = savedId ? list.find((s) => s.id === savedId) : null;
          const session = match || list[0];
          setActiveVmSessionId(session.id);
          setSessionId(session.id);
          setConnInfo({ host: session.host, username: session.username });
        } else {
          if (typeof window !== "undefined") localStorage.removeItem("vm-ide-session");
        }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isElectron() || typeof window === "undefined") return;
    const handlers: Record<string, () => void> = {
      "menu:save": () => activeFile && handleSaveWithPreview(activeFile),
      "menu:newFile": () => handleNewFile(),
      "menu:newFolder": () => handleNewFolder(),
      "menu:toggleTerminal": () => setBottomTab("terminal"),
      "menu:toggleAI": () => setBottomTab("ai"),
      "menu:deploy": () => handleDeploy(),
    };
    const wrapped: Record<string, EventListener> = {};
    for (const [name, fn] of Object.entries(handlers)) {
      wrapped[name] = () => fn();
      window.addEventListener(name, wrapped[name]);
    }
    return () => { for (const [name, fn] of Object.entries(wrapped)) window.removeEventListener(name, fn); };
  });

  const handleVmConnect = useCallback(async (params: any) => {
    if (!isElectron()) return;
    setVmConnecting(true);
    try {
      const result = await electronSsh.connect(params);
      if (result.error) { addToast(`SSH connection failed: ${result.error}`, "error"); }
      else if (result.sessionId) {
        setActiveVmSessionId(result.sessionId);
        setSessionId(result.sessionId);
        if (typeof window !== "undefined") localStorage.setItem("vm-ide-session", result.sessionId);
        setConnInfo({ host: result.host!, username: result.username! });
        addToast(`Connected to ${result.username}@${result.host}`, "success");
      }
    } finally { setVmConnecting(false); }
  }, []);

  const handleVmDisconnect = useCallback(async (vmId: string) => {
    if (!isElectron()) return;
    await electronSsh.disconnect(vmId);
    if (vmId === activeVmSessionId) {
      setActiveVmSessionId(null);
      if (vmId === sessionId) {
        setSessionId(null); setConnInfo(null); setOpenFiles([]); setActiveFile(null);
        if (typeof window !== "undefined") localStorage.removeItem("vm-ide-session");
      }
    }
    addToast("Disconnected", "info");
  }, [activeVmSessionId, sessionId]);

  const handleLogout = useCallback(async () => {
    const ea = isElectron() ? (window as any).electronAPI : null;
    await ea?.auth.logout();
    for (const s of vmSessions) await electronSsh.disconnect(s.id).catch(() => {});
    onLogout();
  }, [vmSessions, onLogout]);

  const handleVmSelect = useCallback((vmId: string) => {
    setActiveVmSessionId(vmId); setSessionId(vmId);
    const s = vmSessions.find((s) => s.id === vmId);
    if (s) setConnInfo({ host: s.host, username: s.username });
    if (typeof window !== "undefined") localStorage.setItem("vm-ide-session", vmId);
  }, [vmSessions]);

  const handleVmRename = useCallback((id: string, newLabel: string) => {
    setVmSessions((prev) => prev.map((s) => s.id === id ? { ...s, label: newLabel } : s));
  }, []);

  const handleVmOpenTerminal = useCallback((id: string) => {
    setActiveVmSessionId(id); setSessionId(id); setBottomTab("terminal");
  }, []);


  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [selectedDir, setSelectedDir] = useState<string>("/home");
  const [explorerRoot, setExplorerRoot] = useState<string>("/home");
  const [terminalCdPath, setTerminalCdPath] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [softRefreshKey, setSoftRefreshKey] = useState(0);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(260);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [bottomTab, setBottomTab] = useState<BottomTab>("terminal");
  const [creatingItem, setCreatingItem] = useState<{ parentPath: string; type: "file" | "directory" } | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const [diffPreview, setDiffPreview] = useState<{ filePath: string; originalContent: string; modifiedContent: string; additions: number; deletions: number } | null>(null);
  const [diffSaving, setDiffSaving] = useState(false);
  const [aiPanelVisible, setAiPanelVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [aiDiagnosis, setAiDiagnosis] = useState<AIAnalysis | null>(null);
  const [aiFilePath, setAiFilePath] = useState<string | null>(null);

  const AI_DAILY_LIMIT = 15;
  const getAiUsageToday = useCallback(() => {
    if (typeof window === "undefined") return 0;
    const key = `ai-usage-${new Date().toISOString().slice(0, 10)}`;
    return parseInt(localStorage.getItem(key) || "0", 10);
  }, []);
  const incrementAiUsage = useCallback(() => {
    const key = `ai-usage-${new Date().toISOString().slice(0, 10)}`;
    const current = parseInt(localStorage.getItem(key) || "0", 10);
    localStorage.setItem(key, String(current + 1));
  }, []);
  const [aiUsageCount, setAiUsageCount] = useState(0);
  React.useEffect(() => { setAiUsageCount(getAiUsageToday()); }, [getAiUsageToday]);

  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [validating, setValidating] = useState(false);
  const { templates: commandTemplates, fetchTemplates } = useCommands(sessionId);
  const [serviceInput, setServiceInput] = useState("");
  const deployment = useDeployment(sessionId);
  const { config: projectConfig } = useProjectConfig(sessionId);
  const [connInfo, setConnInfo] = useState<{ host: string; username: string } | null>(null);

  const handleCommandResult = useCallback((result: CommandResult) => {
    if (result.exitCode === 0) setSoftRefreshKey((k) => k + 1);
  }, []);
  const handleError = useCallback((msg: string) => addToast(msg, "error"), [addToast]);
  const handleSuccess = useCallback((msg: string) => addToast(msg, "success"), [addToast]);


  const handleSelectFile = useCallback(async (path: string) => {
    let alreadyOpen = false;
    setOpenFiles((prev) => { if (prev.find((f) => f.path === path)) alreadyOpen = true; return prev; });
    if (alreadyOpen) { setActiveFile(path); return; }
    if (!sessionId) return;
    try {
      const res = await readFile(sessionId, path);
      setOpenFiles((prev) => { if (prev.find((f) => f.path === res.path)) return prev; return [...prev, { path: res.path, content: res.content, dirty: false }]; });
      setActiveFile(res.path);
    } catch (err: any) { handleError(err.message); }
  }, [sessionId, handleError]);

  const handleSelectDir = useCallback((path: string) => { setSelectedDir(normalizePath(path)); }, []);
  const handleContentChange = useCallback((path: string, content: string) => {
    setOpenFiles((prev) => prev.map((f) => f.path === path ? { ...f, content, dirty: true } : f));
  }, []);

  const handleSaveWithPreview = useCallback(async (path: string) => {
    if (!sessionId) return;
    const file = openFiles.find((f) => f.path === path);
    if (!file || !file.dirty) return;
    try {
      const diff = await diffFile(sessionId, path, file.content);
      if (diff.hunks.length === 0) { setOpenFiles((prev) => prev.map((f) => (f.path === path ? { ...f, dirty: false } : f))); addToast("No changes to save", "info"); return; }
      let originalContent = "";
      try { const current = await readFile(sessionId, path); originalContent = current.content; } catch {}
      setDiffPreview({ filePath: path, originalContent, modifiedContent: file.content, additions: diff.additions, deletions: diff.deletions });
    } catch { handleSave(path); }
  }, [sessionId, openFiles, addToast]);

  const handleSave = useCallback(async (path: string) => {
    if (!sessionId) return;
    const file = openFiles.find((f) => f.path === path);
    if (!file) return;
    try {
      const result = await writeFile(sessionId, path, file.content);
      setOpenFiles((prev) => prev.map((f) => (f.path === path ? { ...f, dirty: false } : f)));
      addToast(result.backupPath ? "File saved (backup created)" : "File saved", "success");
    } catch (err: any) { handleError(err.message); }
  }, [sessionId, openFiles, addToast, handleError]);

  const handleDiffConfirm = useCallback(async () => { if (!diffPreview) return; setDiffSaving(true); await handleSave(diffPreview.filePath); setDiffSaving(false); setDiffPreview(null); }, [diffPreview, handleSave]);
  const handleDiffCancel = useCallback(() => { setDiffPreview(null); }, []);

  const handleCloseFile = useCallback((path: string) => {
    setOpenFiles((prev) => prev.filter((f) => f.path !== path));
    if (activeFile === path) { setActiveFile(() => { const remaining = openFiles.filter((f) => f.path !== path); return remaining.length > 0 ? remaining[remaining.length - 1].path : null; }); }
  }, [activeFile, openFiles]);

  const refreshTree = useCallback(() => { setRefreshKey((k) => k + 1); }, []);
  const handleNewFile = useCallback(() => { if (!sessionId) return; setCreatingItem({ parentPath: explorerRoot, type: "file" }); }, [sessionId, explorerRoot]);
  const handleNewFolder = useCallback(() => { if (!sessionId) return; setCreatingItem({ parentPath: explorerRoot, type: "directory" }); }, [sessionId, explorerRoot]);

  const handleCreateItem = useCallback(async (parentPath: string, name: string, type: "file" | "directory") => {
    if (!sessionId) return;
    const fullPath = joinPath(parentPath, name);
    try {
      if (type === "file") { await writeFile(sessionId, fullPath, ""); addToast("File created", "success"); refreshTree(); handleSelectFile(fullPath); }
      else { await mkdir(sessionId, fullPath); addToast("Folder created", "success"); refreshTree(); }
    } catch (err: any) { handleError(err.message); }
    setCreatingItem(null);
  }, [sessionId, addToast, handleError, refreshTree, handleSelectFile]);

  const handleCancelCreate = useCallback(() => { setCreatingItem(null); }, []);
  const handleItemMoved = useCallback((oldPath: string, newPath: string) => {
    setOpenFiles((prev) => prev.map((f) => (f.path === oldPath ? { ...f, path: newPath } : f)));
    if (activeFile === oldPath) setActiveFile(newPath);
  }, [activeFile]);

  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const handleRenameComplete = useCallback(() => { setRenamingPath(null); }, []);
  const handleDeleteFromTree = useCallback((path: string) => {
    setOpenFiles((prev) => prev.filter((f) => f.path !== path));
    if (activeFile === path) { setActiveFile(() => { const remaining = openFiles.filter((f) => f.path !== path); return remaining.length > 0 ? remaining[remaining.length - 1].path : null; }); }
    refreshTree();
  }, [activeFile, openFiles, refreshTree]);

  const [showCommands, setShowCommands] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarView, setSidebarView] = useState<"explorer" | "search" | "git">("explorer");

  // Apply dark/light mode to root element
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
    }
  }, [darkMode]);

  const runInTerminal = useCallback((cmd: string) => {
    setBottomTab("terminal");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("vinexus:runCommand", { detail: { cmd } }));
    }, 100);
  }, []);

  const handleDeploy = useCallback(async () => {
    for (const f of openFiles.filter((f) => f.dirty)) {
      await handleSave(f.path);
    }
    runInTerminal("echo '--- Vinexus Deploy ---' && ls -la");
  }, [openFiles, runInTerminal]);

  const handleLogs = useCallback(() => {
    runInTerminal("sudo journalctl -xe --no-pager | tail -100");
  }, [runInTerminal]);

  const handleExplain = useCallback(async (filePath: string, content: string) => {
    if (!sessionId) return;
    if (getAiUsageToday() >= AI_DAILY_LIMIT) { addToast(`Daily AI limit reached (${AI_DAILY_LIMIT}/day).`, "error"); return; }
    setAiExplanation(null); setAiDiagnosis(null); setAiFilePath(filePath); setAiLoading(true); setAiPanelVisible(true);
    try { const result = await explainFile(sessionId, filePath, content); setAiExplanation(result); incrementAiUsage(); setAiUsageCount(getAiUsageToday()); } catch (err: any) { addToast(`AI analysis failed: ${err.message}`, "error"); } finally { setAiLoading(false); }
  }, [sessionId, addToast, getAiUsageToday, incrementAiUsage]);

  const handleDiagnose = useCallback(async (service: string, logText: string) => {
    if (!sessionId) return;
    if (getAiUsageToday() >= AI_DAILY_LIMIT) { addToast(`Daily AI limit reached (${AI_DAILY_LIMIT}/day).`, "error"); return; }
    setAiExplanation(null); setAiDiagnosis(null); setAiFilePath(null); setAiLoading(true); setAiPanelVisible(true);
    try { const result = await diagnoseFailure(sessionId, service, logText); setAiDiagnosis(result); incrementAiUsage(); setAiUsageCount(getAiUsageToday()); } catch (err: any) { addToast(`AI diagnosis failed: ${err.message}`, "error"); } finally { setAiLoading(false); }
  }, [sessionId, addToast, getAiUsageToday, incrementAiUsage]);

  const handleValidate = useCallback(async () => {
    if (!sessionId || !activeFile) return;
    setValidating(true); setValidationReport(null);
    try { const report = await validateFile(sessionId, activeFile, true); setValidationReport(report); addToast(report.overallValid ? "Validation passed" : `Validation failed: ${report.results.filter((r) => !r.result.valid).length} error(s)`, report.overallValid ? "success" : "error"); } catch (err: any) { addToast(`Validation failed: ${err.message}`, "error"); } finally { setValidating(false); }
  }, [sessionId, activeFile, addToast]);

  const handleServerCommand = useCallback((cmd: string) => {
    runInTerminal(cmd);
  }, [runInTerminal]);

  const handleTerminalActivity = useCallback(() => { setSoftRefreshKey((k) => k + 1); }, []);
  const handleTerminalCwdChange = useCallback((path: string) => {
    const norm = normalizePath(path);
    setSelectedDir(norm);
    setExplorerRoot(norm);
    setSoftRefreshKey((k) => k + 1);
  }, []);

  const hasDirtyFiles = openFiles.some((f) => f.dirty && f.path === activeFile);
  const dirtyFileCount = openFiles.filter((f) => f.dirty).length;
  const hasService = !!sessionId;

  useKeyboardShortcuts({ onDeploy: hasService ? handleDeploy : undefined, onTerminal: () => setBottomTab("terminal") });

  const handleSidebarDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); const startX = e.clientX; const startW = sidebarWidth;
    const onMove = (ev: MouseEvent) => setSidebarWidth(Math.max(160, Math.min(480, startW + ev.clientX - startX)));
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  }, [sidebarWidth]);

  const handleBottomDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); const startY = e.clientY; const startH = bottomPanelHeight;
    const onMove = (ev: MouseEvent) => setBottomPanelHeight(Math.max(100, Math.min(600, startH - (ev.clientY - startY))));
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  }, [bottomPanelHeight]);

  return (
    <div style={styles.root}>
      {/* Title Bar */}
      <div style={styles.titleBar}>
        <div style={{ width: 72, flexShrink: 0 }} />
        <div style={styles.titleCenter}>
          <img src="/vinexus-wordmark.png" alt="Vinexus" style={styles.titleWordmark} />
          {connInfo && (
            <span style={styles.titleConn}>
              <span style={{ opacity: 0.3 }}>—</span>
              {connInfo.username}@{connInfo.host}
            </span>
          )}
        </div>
        <div style={styles.titleActions}>
          {sessionId && (
            <button onClick={() => activeVmSessionId && handleVmDisconnect(activeVmSessionId)} style={styles.titleDisconnBtn} title="Disconnect">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>
              Disconnect
            </button>
          )}
        </div>
      </div>

      <UpgradeBanner />

      {/* SSH Connection Bar */}
      <SshBar
        sessions={vmSessions}
        activeSessionId={activeVmSessionId}
        onSessionSelect={handleVmSelect}
        onConnect={handleVmConnect}
        onDisconnect={handleVmDisconnect}
        onRename={handleVmRename}
        onOpenTerminal={handleVmOpenTerminal}
        isConnecting={vmConnecting}
      />

      {/* App Body */}
      <div style={styles.appBody}>
        {/* Activity Bar */}
        <div style={styles.activityBar}>
          <button
            style={{ ...styles.actBtn, ...(sidebarView === "explorer" ? styles.actBtnActive : {}) }}
            title="Explorer"
            onClick={() => setSidebarView("explorer")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button
            style={{ ...styles.actBtn, ...(sidebarView === "search" ? styles.actBtnActive : {}) }}
            title="Search"
            onClick={() => setSidebarView("search")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button
            style={{ ...styles.actBtn, ...(sidebarView === "git" ? styles.actBtnActive : {}) }}
            title="Source Control"
            onClick={() => setSidebarView("git")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M13 6h3a2 2 0 0 1 2 2v7" /><line x1="6" y1="9" x2="6" y2="21" />
            </svg>
          </button>
          <div style={{ flex: 1 }} />
          <button style={styles.actBtn} title="Settings" onClick={() => setSettingsOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <button style={styles.actBtn} title="Account" onClick={() => setProfileOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>

        {/* Sidebar */}
        <div style={{ ...styles.sidebar, width: sidebarWidth }}>
          {sidebarView === "explorer" && (
            <>
              <div style={styles.sidebarHeader}>
                <span className="label-sm">Explorer</span>
                <div style={styles.sidebarHeaderBtns}>
                  {sessionId && (<>
                    <button style={styles.sidebarIconBtn} onClick={handleNewFile} title="New File">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>
                    </button>
                    <button style={styles.sidebarIconBtn} onClick={handleNewFolder} title="New Folder">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>
                    </button>
                    <button style={styles.sidebarIconBtn} onClick={refreshTree} title="Refresh">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                    </button>
                  </>)}
                </div>
              </div>
              {sessionId && connInfo && (
                <div style={styles.sidebarConnStatus}>
                  <span style={styles.sidebarConnDot} />
                  <span style={styles.sidebarConnText}>{connInfo.username}@{connInfo.host}</span>
                </div>
              )}
              <FileTree
                sessionId={sessionId}
                onSelectFile={handleSelectFile}
                onSelectDir={handleSelectDir}
                selectedFile={activeFile}
                onError={handleError}
                onSuccess={handleSuccess}
                refreshKey={refreshKey}
                softRefreshKey={softRefreshKey}
                creatingItem={creatingItem}
                onCreateItem={handleCreateItem}
                onCancelCreate={handleCancelCreate}
                onItemMoved={handleItemMoved}
                renamingPath={renamingPath}
                onRenameComplete={handleRenameComplete}
                onDeleteItem={handleDeleteFromTree}
                onRootPathChange={(path) => { setExplorerRoot(path); setTerminalCdPath(path); }}
                externalRootPath={selectedDir}
              />
            </>
          )}
          {sidebarView === "search" && (
            <SearchPanel sessionId={sessionId} onSelectFile={handleSelectFile} onError={handleError} explorerRoot={explorerRoot} />
          )}
          {sidebarView === "git" && (
            <GitPanel sessionId={sessionId} onError={handleError} onSuccess={handleSuccess} explorerRoot={explorerRoot} runInTerminal={runInTerminal} />
          )}
        </div>

        <div style={styles.sidebarHandle} onMouseDown={handleSidebarDrag} />

        {/* Editor + Panels */}
        <div style={styles.right}>
          <Toolbar
            sessionId={sessionId}
            activeFile={activeFile}
            hasDirtyFiles={hasDirtyFiles}
            onSave={() => activeFile && handleSave(activeFile)}
            onNewFile={handleNewFile}
            onNewFolder={handleNewFolder}
            onDeploy={handleDeploy}
            hasService={hasService}
            isDeploying={deployment.loading}
            showCommands={showCommands}
            onToggleCommands={() => setShowCommands((v) => !v)}
          >
            {activeFile && (<ValidationBadge report={validationReport} loading={validating} onValidate={handleValidate} disabled={!sessionId} />)}
          </Toolbar>

          {showCommands && (
            <ProFeature feature="commands">
              <CommandBar sessionId={sessionId} templates={commandTemplates} onFetchTemplates={fetchTemplates} onResult={handleCommandResult} onError={handleError} onSuccess={handleSuccess} />
            </ProFeature>
          )}

          <div style={styles.editorArea}>
            <ErrorBoundary fallbackLabel="Editor">
              <Editor openFiles={openFiles} activeFile={activeFile} onSetActive={setActiveFile} onContentChange={handleContentChange} onSave={handleSaveWithPreview} onCloseFile={handleCloseFile} onExplain={handleExplain} aiLoading={aiLoading} />
            </ErrorBoundary>
          </div>

          <div style={styles.bottomHandle} onMouseDown={handleBottomDrag} />
          <BottomPanelTabs activeTab={bottomTab} onTabChange={setBottomTab} hasDeployStatus={deployment.status !== null} deployFailed={deployment.status?.state === "failed"} agentState="" />

          <div style={{ ...styles.bottomPanel, height: bottomPanelHeight }}>
            <div style={{ ...styles.panelContent, display: bottomTab === "terminal" ? "flex" : "none" }}>
              <ErrorBoundary fallbackLabel="Terminal">
                <TerminalPanel sessionId={sessionId} onError={handleError} onActivity={handleTerminalActivity} cdPath={terminalCdPath} onCwdChange={handleTerminalCwdChange} />
              </ErrorBoundary>
            </div>
            <div style={{ ...styles.panelContent, display: bottomTab === "deploy" ? "flex" : "none" }}>
              <ErrorBoundary fallbackLabel="Deploy">
                <DeployPanel status={deployment.status} loading={deployment.loading} error={deployment.error} onDeploy={handleDeploy} onCancel={deployment.cancel} onRollback={deployment.rollback} onReset={deployment.reset} hasService={hasService} />
              </ErrorBoundary>
            </div>
            <div style={{ ...styles.panelContent, display: bottomTab === "ai" ? "flex" : "none" }}>
              <ErrorBoundary fallbackLabel="AI Chat">
                <AIChatPanel sessionId={sessionId} plan={user.plan.toLowerCase()} userId={user.id} onError={handleError} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>

      <StatusBar sessionId={sessionId} host={connInfo?.host} username={connInfo?.username} activeFile={activeFile} openFileCount={openFiles.length} dirtyFileCount={dirtyFileCount} />
      <AIInsightsPanel visible={aiPanelVisible} loading={aiLoading} explanation={aiExplanation} diagnosis={aiDiagnosis} filePath={aiFilePath} onClose={() => setAiPanelVisible(false)} usageCount={aiUsageCount} usageLimit={AI_DAILY_LIMIT} />
      {diffPreview && (<DiffView originalContent={diffPreview.originalContent} modifiedContent={diffPreview.modifiedContent} filePath={diffPreview.filePath} additions={diffPreview.additions} deletions={diffPreview.deletions} onConfirm={handleDiffConfirm} onCancel={handleDiffCancel} loading={diffSaving} />)}
      {settingsOpen && (
        <div style={settingsStyles.overlay} onClick={() => setSettingsOpen(false)}>
          <div style={settingsStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={settingsStyles.header}>
              <span style={settingsStyles.title}>Settings</span>
              <button style={settingsStyles.closeBtn} onClick={() => setSettingsOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={settingsStyles.section}>
              <div style={settingsStyles.sectionLabel}>Appearance</div>
              <div style={settingsStyles.row}>
                <div>
                  <div style={settingsStyles.rowLabel}>Theme</div>
                  <div style={settingsStyles.rowDesc}>Switch between light and dark mode</div>
                </div>
                <button
                  style={{ ...settingsStyles.toggle, ...(darkMode ? settingsStyles.toggleOn : {}) }}
                  onClick={() => setDarkMode(!darkMode)}
                  title="Toggle dark mode"
                >
                  <span style={{ ...settingsStyles.toggleThumb, ...(darkMode ? settingsStyles.toggleThumbOn : {}) }} />
                </button>
              </div>
            </div>

            <div style={settingsStyles.section}>
              <div style={settingsStyles.sectionLabel}>Account</div>
              <div style={settingsStyles.planRow}>
                <div style={settingsStyles.planBadge}>Free</div>
                <div>
                  <div style={settingsStyles.rowLabel}>Free Plan</div>
                  <div style={settingsStyles.rowDesc}>Upgrade for advanced deploy pipelines & team features</div>
                </div>
              </div>
              <button style={settingsStyles.upgradeBtn}>Upgrade to Pro</button>
            </div>

            <div style={settingsStyles.section}>
              <div style={settingsStyles.sectionLabel}>About</div>
              <div style={settingsStyles.aboutRow}>
                <span style={settingsStyles.rowDesc}>Vinexus Desktop</span>
                <span style={settingsStyles.rowDesc}>v0.1.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {profileOpen && (
        <div style={settingsStyles.overlay} onClick={() => setProfileOpen(false)}>
          <div style={{ ...settingsStyles.modal, width: 380 }} onClick={(e) => e.stopPropagation()}>
            <div style={settingsStyles.header}>
              <span style={settingsStyles.title}>Account</span>
              <button style={settingsStyles.closeBtn} onClick={() => setProfileOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* User identity */}
            <div style={settingsStyles.section}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--accent-surface)", border: "2px solid var(--accent-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-sans)" }}>
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-bright)", fontFamily: "var(--font-sans)" }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)", marginTop: 1 }}>{user.email}</div>
                </div>
              </div>
            </div>

            {/* Active connection */}
            <div style={settingsStyles.section}>
              <div style={settingsStyles.sectionLabel}>Active Connection</div>
              {connInfo ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--bg-secondary)", borderRadius: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0, display: "inline-block" }} />
                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{connInfo.username}@{connInfo.host}</span>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>No active connection</div>
              )}
            </div>

            {/* Sign out */}
            <div style={{ padding: "12px 20px 16px" }}>
              <button
                style={{ width: "100%", padding: "9px 0", background: "rgba(185,28,28,0.07)", color: "var(--danger)", border: "1px solid rgba(185,28,28,0.2)", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

const styles: Record<string, any> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
    background: "var(--bg-primary)",
  },
  titleBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 38,
    paddingRight: 14,
    background: "var(--bg-secondary)",
    flexShrink: 0,
    position: "relative" as const,
    userSelect: "none" as const,
    WebkitAppRegion: "drag" as any,
  },
  titleCenter: {
    position: "absolute" as const,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: 7,
    pointerEvents: "none" as const,
  },
  titleLogoImg: {
    width: 22,
    height: 22,
    borderRadius: 6,
    objectFit: "cover" as const,
    flexShrink: 0,
  },
  titleWordmark: {
    height: 14,
    width: "auto",
    objectFit: "contain" as const,
    filter: "brightness(0) invert(1)",
    opacity: 0.85,
  },
  titleConn: {
    fontSize: 11,
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  titleActions: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    zIndex: 1,
    WebkitAppRegion: "no-drag" as any,
  },
  titleDisconnBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 9px",
    background: "rgba(185, 28, 28, 0.07)",
    color: "var(--danger)",
    border: "1px solid rgba(185, 28, 28, 0.18)",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    WebkitAppRegion: "no-drag" as any,
  },
  appBody: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  activityBar: {
    width: 44,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "8px 0",
    gap: 2,
    background: "var(--bg-secondary)",
  },
  actBtn: {
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.15s, color 0.15s",
  },
  actBtnActive: {
    color: "var(--accent)",
    background: "var(--accent-surface)",
  },
  sidebar: {
    flexShrink: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
    background: "var(--bg-secondary)",
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px 7px",
    flexShrink: 0,
  },
  sidebarHeaderBtns: {
    display: "flex",
    alignItems: "center",
    gap: 1,
  },
  sidebarIconBtn: {
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    borderRadius: 4,
    cursor: "pointer",
    transition: "background 0.1s, color 0.1s",
  },
  sidebarConnStatus: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 12px 6px",
    flexShrink: 0,
  },
  sidebarConnDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 5px rgba(34, 197, 94, 0.6)",
    flexShrink: 0,
  },
  sidebarConnText: {
    fontSize: 11,
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)",
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
    whiteSpace: "nowrap" as const,
  },
  sidebarHandle: {
    width: 1,
    cursor: "col-resize",
    background: "var(--border)",
    flexShrink: 0,
    transition: "background 0.15s",
  },
  right: {
    display: "flex",
    flexDirection: "column" as const,
    flex: 1,
    overflow: "hidden",
    background: "var(--bg-elevated)",
  },
  editorArea: {
    flex: 1,
    overflow: "hidden",
  },
  bottomHandle: {
    height: 2,
    cursor: "row-resize",
    background: "var(--border)",
    flexShrink: 0,
  },
  bottomPanel: {
    flexShrink: 0,
    overflow: "hidden",
    position: "relative" as const,
  },
  panelContent: {
    position: "absolute" as const,
    inset: 0,
    flexDirection: "column" as const,
    overflow: "hidden",
  },
};

const settingsStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(7, 14, 29, 0.45)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    width: 420,
    maxWidth: "calc(100vw - 48px)",
    boxShadow: "0 20px 60px rgba(7,14,29,0.25)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px 14px",
    borderBottom: "1px solid var(--border)",
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-bright)",
    letterSpacing: "-0.01em",
    fontFamily: "var(--font-sans)",
  },
  closeBtn: {
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    borderRadius: 4,
    cursor: "pointer",
  },
  section: {
    padding: "14px 20px",
    borderBottom: "1px solid var(--border)",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "var(--text-muted)",
    marginBottom: 10,
    fontFamily: "var(--font-sans)",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-primary)",
    fontFamily: "var(--font-sans)",
  },
  rowDesc: {
    fontSize: 11,
    color: "var(--text-muted)",
    marginTop: 2,
    fontFamily: "var(--font-sans)",
  },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    background: "var(--border)",
    border: "none",
    cursor: "pointer",
    position: "relative" as const,
    flexShrink: 0,
    transition: "background 0.2s",
    padding: 0,
  },
  toggleOn: {
    background: "var(--accent)",
  },
  toggleThumb: {
    position: "absolute" as const,
    top: 2,
    left: 2,
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "#ffffff",
    transition: "left 0.2s",
    display: "block",
  },
  toggleThumbOn: {
    left: 18,
  },
  planRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  planBadge: {
    padding: "2px 8px",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-secondary)",
    flexShrink: 0,
    fontFamily: "var(--font-sans)",
  },
  upgradeBtn: {
    width: "100%",
    padding: "8px 0",
    background: "var(--accent)",
    color: "#ffffff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
  },
  aboutRow: {
    display: "flex",
    justifyContent: "space-between",
  },
};
