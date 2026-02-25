"use client";
import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import ConnectForm from "@/components/ConnectForm";
import FileTree from "@/components/FileTree";
import Editor from "@/components/Editor";
import Toolbar from "@/components/Toolbar";
import ToastContainer from "@/components/ToastContainer";
import CommandBar from "@/components/CommandBar";
import BottomPanelTabs, { BottomTab } from "@/components/BottomPanelTabs";
import DeployPanel from "@/components/DeployPanel";
import DiffView from "@/components/DiffView";
import AIInsightsPanel from "@/components/AIInsightsPanel";
import AIDeveloperPanel from "@/components/AIDeveloperPanel";
import ValidationBadge from "@/components/ValidationBadge";
import ErrorBoundary from "@/components/ErrorBoundary";
import StatusBar from "@/components/StatusBar";
import UpgradeBanner from "@/components/UpgradeBanner";
import ProFeature from "@/components/ProFeature";
import { useToast } from "@/lib/useToast";
import { useCommands } from "@/hooks/useCommands";
import { useDeployment } from "@/hooks/useDeployment";
import { useAgentSession } from "@/hooks/useAgentSession";
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
  clearAuthToken,
} from "@/lib/api";
import { normalizePath, joinPath } from "@/lib/pathUtils";

const TerminalPanel = dynamic(() => import("@/components/Terminal"), {
  ssr: false,
});

interface OpenFile {
  path: string;
  content: string;
  dirty: boolean;
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vm-ide-session") || null;
    }
    return null;
  });
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [selectedDir, setSelectedDir] = useState<string>("/home");
  const [terminalCdPath, setTerminalCdPath] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [softRefreshKey, setSoftRefreshKey] = useState(0);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(250);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [bottomTab, setBottomTab] = useState<BottomTab>("terminal");
  const [creatingItem, setCreatingItem] = useState<{
    parentPath: string;
    type: "file" | "directory";
  } | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  // Diff preview state
  const [diffPreview, setDiffPreview] = useState<{
    filePath: string;
    originalContent: string;
    modifiedContent: string;
    additions: number;
    deletions: number;
  } | null>(null);
  const [diffSaving, setDiffSaving] = useState(false);

  // AI Insights
  const [aiPanelVisible, setAiPanelVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [aiDiagnosis, setAiDiagnosis] = useState<AIAnalysis | null>(null);
  const [aiFilePath, setAiFilePath] = useState<string | null>(null);

  // AI usage limit (15 file analyses per day)
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
  // Sync usage count on mount
  React.useEffect(() => {
    setAiUsageCount(getAiUsageToday());
  }, [getAiUsageToday]);

  // AI Developer Agent Session
  const agent = useAgentSession(sessionId);

  // Validation
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [validating, setValidating] = useState(false);

  // Commands
  const {
    templates: commandTemplates,
    fetchTemplates,
  } = useCommands(sessionId);

  // Service name from CommandBar (shared with LogsPanel)
  const [serviceInput, setServiceInput] = useState("");

  // Deploy
  const deployment = useDeployment(sessionId);

  // Project config
  const { config: projectConfig } = useProjectConfig(sessionId);

  // Connection info for status bar
  const [connInfo, setConnInfo] = useState<{ host: string; username: string } | null>(null);

  const handleCommandResult = useCallback(
    (result: CommandResult) => {
      if (result.exitCode === 0) {
        setSoftRefreshKey((k) => k + 1);
      }
    },
    []
  );

  const handleError = useCallback(
    (msg: string) => addToast(msg, "error"),
    [addToast]
  );

  const handleSuccess = useCallback(
    (msg: string) => addToast(msg, "success"),
    [addToast]
  );

  const handleConnect = useCallback(
    (id: string, host: string, username: string) => {
      setSessionId(id);
      setConnInfo({ host, username });
      localStorage.setItem("vm-ide-session", id);
      addToast("Connected successfully", "success");
    },
    [addToast]
  );

  const handleDisconnect = useCallback(() => {
    setSessionId(null);
    setConnInfo(null);
    setOpenFiles([]);
    setActiveFile(null);
    localStorage.removeItem("vm-ide-session");
    clearAuthToken();
    addToast("Disconnected", "info");
  }, [addToast]);

  const handleSelectFile = useCallback(
    async (path: string) => {
      // Always check latest state via functional update to prevent duplicates
      let alreadyOpen = false;
      setOpenFiles((prev) => {
        if (prev.find((f) => f.path === path)) {
          alreadyOpen = true;
        }
        return prev;
      });
      if (alreadyOpen) {
        setActiveFile(path);
        return;
      }
      if (!sessionId) return;
      try {
        const res = await readFile(sessionId, path);
        setOpenFiles((prev) => {
          // Double-check to prevent race conditions
          if (prev.find((f) => f.path === res.path)) return prev;
          return [...prev, { path: res.path, content: res.content, dirty: false }];
        });
        setActiveFile(res.path);
      } catch (err: any) {
        handleError(err.message);
      }
    },
    [sessionId, handleError]
  );

  const handleSelectDir = useCallback((path: string) => {
    setSelectedDir(normalizePath(path));
  }, []);

  const handleContentChange = useCallback((path: string, content: string) => {
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.path === path ? { ...f, content, dirty: true } : f
      )
    );
  }, []);

  // Show diff preview before save
  const handleSaveWithPreview = useCallback(
    async (path: string) => {
      if (!sessionId) return;
      const file = openFiles.find((f) => f.path === path);
      if (!file || !file.dirty) return;
      try {
        const diff = await diffFile(sessionId, path, file.content);
        if (diff.hunks.length === 0) {
          setOpenFiles((prev) =>
            prev.map((f) => (f.path === path ? { ...f, dirty: false } : f))
          );
          addToast("No changes to save", "info");
          return;
        }
        let originalContent = "";
        try {
          const current = await readFile(sessionId, path);
          originalContent = current.content;
        } catch {
          // New file
        }
        setDiffPreview({
          filePath: path,
          originalContent,
          modifiedContent: file.content,
          additions: diff.additions,
          deletions: diff.deletions,
        });
      } catch {
        handleSave(path);
      }
    },
    [sessionId, openFiles, addToast]
  );

  // Direct save
  const handleSave = useCallback(
    async (path: string) => {
      if (!sessionId) return;
      const file = openFiles.find((f) => f.path === path);
      if (!file) return;
      try {
        const result = await writeFile(sessionId, path, file.content);
        setOpenFiles((prev) =>
          prev.map((f) => (f.path === path ? { ...f, dirty: false } : f))
        );
        if (result.backupPath) {
          addToast("File saved (backup created)", "success");
        } else {
          addToast("File saved", "success");
        }
      } catch (err: any) {
        handleError(err.message);
      }
    },
    [sessionId, openFiles, addToast, handleError]
  );

  const handleDiffConfirm = useCallback(async () => {
    if (!diffPreview) return;
    setDiffSaving(true);
    await handleSave(diffPreview.filePath);
    setDiffSaving(false);
    setDiffPreview(null);
  }, [diffPreview, handleSave]);

  const handleDiffCancel = useCallback(() => {
    setDiffPreview(null);
  }, []);

  const handleCloseFile = useCallback(
    (path: string) => {
      setOpenFiles((prev) => prev.filter((f) => f.path !== path));
      if (activeFile === path) {
        setActiveFile((prev) => {
          const remaining = openFiles.filter((f) => f.path !== path);
          return remaining.length > 0 ? remaining[remaining.length - 1].path : null;
        });
      }
    },
    [activeFile, openFiles]
  );

  const refreshTree = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleNewFile = useCallback(() => {
    if (!sessionId) return;
    setCreatingItem({ parentPath: selectedDir, type: "file" });
  }, [sessionId, selectedDir]);

  const handleNewFolder = useCallback(() => {
    if (!sessionId) return;
    setCreatingItem({ parentPath: selectedDir, type: "directory" });
  }, [sessionId, selectedDir]);

  const handleCreateItem = useCallback(
    async (parentPath: string, name: string, type: "file" | "directory") => {
      if (!sessionId) return;
      const fullPath = joinPath(parentPath, name);
      try {
        if (type === "file") {
          await writeFile(sessionId, fullPath, "");
          addToast("File created", "success");
          refreshTree();
          handleSelectFile(fullPath);
        } else {
          await mkdir(sessionId, fullPath);
          addToast("Folder created", "success");
          refreshTree();
        }
      } catch (err: any) {
        handleError(err.message);
      }
      setCreatingItem(null);
    },
    [sessionId, addToast, handleError, refreshTree, handleSelectFile]
  );

  const handleCancelCreate = useCallback(() => {
    setCreatingItem(null);
  }, []);

  const handleItemMoved = useCallback(
    (oldPath: string, newPath: string) => {
      setOpenFiles((prev) =>
        prev.map((f) => (f.path === oldPath ? { ...f, path: newPath } : f))
      );
      if (activeFile === oldPath) {
        setActiveFile(newPath);
      }
    },
    [activeFile]
  );

  // Inline rename state (triggered from context menu)
  const [renamingPath, setRenamingPath] = useState<string | null>(null);

  const handleRenameComplete = useCallback(() => {
    setRenamingPath(null);
  }, []);

  // Delete from context menu (any file in tree)
  const handleDeleteFromTree = useCallback(
    (path: string) => {
      // Close the file if it's open
      setOpenFiles((prev) => prev.filter((f) => f.path !== path));
      if (activeFile === path) {
        setActiveFile((prev) => {
          const remaining = openFiles.filter((f) => f.path !== path);
          return remaining.length > 0 ? remaining[remaining.length - 1].path : null;
        });
      }
      refreshTree();
    },
    [activeFile, openFiles, refreshTree]
  );

  // Toggle command bar visibility
  const [showCommands, setShowCommands] = useState(false);

  // AI Developer: handle live file edits from agent
  const handleAgentFileEdit = useCallback(
    (filePath: string, content: string) => {
      setOpenFiles((prev) => {
        const existing = prev.find((f) => f.path === filePath);
        if (existing) {
          return prev.map((f) =>
            f.path === filePath ? { ...f, content, dirty: false } : f
          );
        }
        return [...prev, { path: filePath, content, dirty: false }];
      });
      setActiveFile(filePath);
    },
    []
  );

  // Deploy handler
  const handleDeploy = useCallback(() => {
    // Collect dirty files to save as part of deploy
    const dirtyFiles = openFiles
      .filter((f) => f.dirty)
      .map((f) => ({ path: f.path, content: f.content }));

    deployment.deploy(dirtyFiles);
    setBottomTab("deploy");

    // Mark saved files as clean
    if (dirtyFiles.length > 0) {
      setOpenFiles((prev) =>
        prev.map((f) => (f.dirty ? { ...f, dirty: false } : f))
      );
    }
  }, [openFiles, deployment]);



  // AI: Explain file (limited to AI_DAILY_LIMIT per day)
  const handleExplain = useCallback(
    async (filePath: string, content: string) => {
      if (!sessionId) return;

      const currentUsage = getAiUsageToday();
      if (currentUsage >= AI_DAILY_LIMIT) {
        addToast(
          `Daily AI limit reached (${AI_DAILY_LIMIT} files/day). Resets at midnight.`,
          "error"
        );
        return;
      }

      setAiExplanation(null);
      setAiDiagnosis(null);
      setAiFilePath(filePath);
      setAiLoading(true);
      setAiPanelVisible(true);
      try {
        const result = await explainFile(sessionId, filePath, content);
        setAiExplanation(result);
        incrementAiUsage();
        setAiUsageCount(getAiUsageToday());
      } catch (err: any) {
        addToast(`AI analysis failed: ${err.message}`, "error");
      } finally {
        setAiLoading(false);
      }
    },
    [sessionId, addToast, getAiUsageToday, incrementAiUsage, AI_DAILY_LIMIT]
  );

  // AI: Diagnose failure from logs (shared daily limit)
  const handleDiagnose = useCallback(
    async (service: string, logText: string) => {
      if (!sessionId) return;

      const currentUsage = getAiUsageToday();
      if (currentUsage >= AI_DAILY_LIMIT) {
        addToast(
          `Daily AI limit reached (${AI_DAILY_LIMIT}/day). Resets at midnight.`,
          "error"
        );
        return;
      }

      setAiExplanation(null);
      setAiDiagnosis(null);
      setAiFilePath(null);
      setAiLoading(true);
      setAiPanelVisible(true);
      try {
        const result = await diagnoseFailure(sessionId, service, logText);
        setAiDiagnosis(result);
        incrementAiUsage();
        setAiUsageCount(getAiUsageToday());
      } catch (err: any) {
        addToast(`AI diagnosis failed: ${err.message}`, "error");
      } finally {
        setAiLoading(false);
      }
    },
    [sessionId, addToast, getAiUsageToday, incrementAiUsage, AI_DAILY_LIMIT]
  );

  // Validate active file
  const handleValidate = useCallback(async () => {
    if (!sessionId || !activeFile) return;
    setValidating(true);
    setValidationReport(null);
    try {
      const report = await validateFile(sessionId, activeFile, true);
      setValidationReport(report);
      if (report.overallValid) {
        addToast("Validation passed", "success");
      } else {
        const errorCount = report.results.filter((r) => !r.result.valid).length;
        addToast(`Validation failed: ${errorCount} error(s)`, "error");
      }
    } catch (err: any) {
      addToast(`Validation failed: ${err.message}`, "error");
    } finally {
      setValidating(false);
    }
  }, [sessionId, activeFile, addToast]);

  const handleTerminalActivity = useCallback(() => {
    setSoftRefreshKey((k) => k + 1);
  }, []);

  // When the terminal detects a CWD change (via PROMPT_COMMAND),
  // update the explorer root to match.
  const handleTerminalCwdChange = useCallback((path: string) => {
    const normalized = normalizePath(path);
    setSelectedDir(normalized);
    // Also trigger a soft refresh so the file tree updates
    setSoftRefreshKey((k) => k + 1);
  }, []);

  const hasDirtyFiles = openFiles.some((f) => f.dirty && f.path === activeFile);
  const dirtyFileCount = openFiles.filter((f) => f.dirty).length;
  const hasService =
    (projectConfig?.services?.length ?? 0) > 0 || serviceInput.trim().length > 0;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onDeploy: hasService ? handleDeploy : undefined,
    onTerminal: () => setBottomTab("terminal"),
  });

  // Drag resize for sidebar
  const handleSidebarDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = sidebarWidth;
      const onMove = (ev: MouseEvent) => {
        const newW = Math.max(150, Math.min(500, startW + ev.clientX - startX));
        setSidebarWidth(newW);
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [sidebarWidth]
  );

  // Drag resize for bottom panel
  const handleBottomDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const startH = bottomPanelHeight;
      const onMove = (ev: MouseEvent) => {
        const newH = Math.max(100, Math.min(600, startH - (ev.clientY - startY)));
        setBottomPanelHeight(newH);
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [bottomPanelHeight]
  );

  return (
    <div style={styles.root}>
      <UpgradeBanner />
      {/* Top: Connect form */}
      <ConnectForm
        sessionId={sessionId}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onError={handleError}
      />

      {/* Toolbar */}
      <Toolbar
        sessionId={sessionId}
        activeFile={activeFile}
        hasDirtyFiles={hasDirtyFiles}
        onSave={() => activeFile && handleSaveWithPreview(activeFile)}
        onNewFile={handleNewFile}
        onNewFolder={handleNewFolder}
        onDeploy={handleDeploy}
        hasService={hasService}
        isDeploying={deployment.loading}
        showCommands={showCommands}
        onToggleCommands={() => setShowCommands((v) => !v)}
      >
        {activeFile && (
          <ValidationBadge
            report={validationReport}
            loading={validating}
            onValidate={handleValidate}
            disabled={!sessionId}
          />
        )}
      </Toolbar>

      {/* Command Bar (collapsible, Pro only) */}
      {showCommands && (
        <ProFeature feature="commands">
          <CommandBar
            sessionId={sessionId}
            templates={commandTemplates}
            onFetchTemplates={fetchTemplates}
            onResult={handleCommandResult}
            onError={handleError}
            onSuccess={handleSuccess}
          />
        </ProFeature>
      )}

      {/* Main area: sidebar + editor + bottom panel */}
      <div style={styles.main}>
        {/* Sidebar */}
        <div style={{ ...styles.sidebar, width: sidebarWidth }}>
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
            onRootPathChange={setTerminalCdPath}
            externalRootPath={selectedDir}
          />
        </div>

        {/* Sidebar resize handle */}
        <div style={styles.sidebarHandle} onMouseDown={handleSidebarDrag} />

        {/* Right: editor + bottom panel */}
        <div style={styles.right}>
          {/* Editor */}
          <div style={styles.editorArea}>
            <ErrorBoundary fallbackLabel="Editor">
              <Editor
                openFiles={openFiles}
                activeFile={activeFile}
                onSetActive={setActiveFile}
                onContentChange={handleContentChange}
                onSave={handleSaveWithPreview}
                onCloseFile={handleCloseFile}
                onExplain={handleExplain}
                aiLoading={aiLoading}
              />
            </ErrorBoundary>
          </div>

          {/* Bottom panel resize handle */}
          <div style={styles.bottomHandle} onMouseDown={handleBottomDrag} />

          {/* Bottom panel tabs */}
          <BottomPanelTabs
            activeTab={bottomTab}
            onTabChange={setBottomTab}
            hasDeployStatus={deployment.status !== null}
            deployFailed={deployment.status?.state === "failed"}
            agentState={agent.state}
          />

          {/* Bottom panel content */}
          <div style={{ ...styles.bottomPanel, height: bottomPanelHeight }}>
            {/* Terminal */}
            <div
              style={{
                ...styles.panelContent,
                display: bottomTab === "terminal" ? "flex" : "none",
              }}
            >
              <ErrorBoundary fallbackLabel="Terminal">
                <TerminalPanel
                  sessionId={sessionId}
                  onError={handleError}
                  onActivity={handleTerminalActivity}
                  cdPath={terminalCdPath}
                  onCwdChange={handleTerminalCwdChange}
                />
              </ErrorBoundary>
            </div>

            {/* AI Developer Tab */}
            <div
              style={{
                ...styles.panelContent,
                display: bottomTab === "ai" ? "flex" : "none",
                background: "var(--bg-primary)", // Ensure proper background
              }}
            >
              <ErrorBoundary fallbackLabel="AI Developer">
                <AIDeveloperPanel
                  sessionId={sessionId}
                  agent={agent}
                  activeFile={activeFile}
                  activeFileContent={openFiles.find((f) => f.path === activeFile)?.content}
                  workspaceRoot={selectedDir}
                  onFileEdit={handleAgentFileEdit}
                />
              </ErrorBoundary>
            </div>

            {/* Deploy */}
            <div
              style={{
                ...styles.panelContent,
                display: bottomTab === "deploy" ? "flex" : "none",
              }}
            >
              <ErrorBoundary fallbackLabel="Deploy">
                <DeployPanel
                  status={deployment.status}
                  loading={deployment.loading}
                  error={deployment.error}
                  onDeploy={handleDeploy}
                  onCancel={deployment.cancel}
                  onRollback={deployment.rollback}
                  onReset={deployment.reset}
                  hasService={hasService}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        sessionId={sessionId}
        host={connInfo?.host}
        username={connInfo?.username}
        activeFile={activeFile}
        openFileCount={openFiles.length}
        dirtyFileCount={dirtyFileCount}
      />

      {/* AI Insights Panel */}
      <AIInsightsPanel
        visible={aiPanelVisible}
        loading={aiLoading}
        explanation={aiExplanation}
        diagnosis={aiDiagnosis}
        filePath={aiFilePath}
        onClose={() => setAiPanelVisible(false)}
        usageCount={aiUsageCount}
        usageLimit={AI_DAILY_LIMIT}
      />



      {/* Diff Preview Modal */}
      {diffPreview && (
        <DiffView
          originalContent={diffPreview.originalContent}
          modifiedContent={diffPreview.modifiedContent}
          filePath={diffPreview.filePath}
          additions={diffPreview.additions}
          deletions={diffPreview.deletions}
          onConfirm={handleDiffConfirm}
          onCancel={handleDiffCancel}
          loading={diffSaving}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
    background: "var(--bg-primary)",
  },
  main: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  sidebar: {
    flexShrink: 0,
    overflow: "hidden",
  },
  sidebarHandle: {
    width: 3,
    cursor: "col-resize",
    background: "var(--border)",
    flexShrink: 0,
    transition: "background 0.15s",
  },
  right: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
  },
  editorArea: {
    flex: 1,
    overflow: "hidden",
  },
  bottomHandle: {
    height: 3,
    cursor: "row-resize",
    background: "var(--border)",
    flexShrink: 0,
    transition: "background 0.15s",
  },
  bottomPanel: {
    flexShrink: 0,
    overflow: "hidden",
    position: "relative",
  },
  panelContent: {
    position: "absolute",
    inset: 0,
    flexDirection: "column",
    overflow: "hidden",
  },
};
