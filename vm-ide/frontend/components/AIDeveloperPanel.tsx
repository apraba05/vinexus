"use client";
import React, { useState, useRef, useEffect } from "react";
import { useAgentSession, AgentLogEntry } from "@/hooks/useAgentSession";
import { AgentContext, AgentOptions, AgentState } from "@/lib/api";
import { usePlan } from "@/contexts/PlanContext";
import Link from "next/link";

interface Props {
    sessionId: string | null;
    agent: ReturnType<typeof useAgentSession>;
    activeFile?: string | null;
    activeFileContent?: string;
    workspaceRoot: string;
    /** Callback when agent edits a file — opens it in the editor */
    onFileEdit?: (path: string, content: string) => void;
}

export default function AIDeveloperPanel({
    sessionId,
    agent,
    activeFile,
    activeFileContent,
    workspaceRoot,
    onFileEdit,
}: Props) {
    const { features, isPro } = usePlan();

    const [prompt, setPrompt] = useState("");
    const [contextMode, setContextMode] = useState<"file" | "selection" | "folder" | "repo">("file");
    const [autoRun, setAutoRun] = useState(true);
    const [autoFix, setAutoFix] = useState(true);
    const [autoDeps, setAutoDeps] = useState(true);
    const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");

    useEffect(() => {
        if (activeTab === "history") {
            agent.fetchHistory();
        }
    }, [activeTab, agent.fetchHistory]);

    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [agent.logs.length]);

    // Forward file edits to parent
    useEffect(() => {
        if (!onFileEdit) return;
        const lastEdit = agent.logs.filter((l) => l.type === "edit" && l.meta?.content).pop();
        if (lastEdit?.meta) {
            onFileEdit(lastEdit.meta.path, lastEdit.meta.content);
        }
    }, [agent.logs, onFileEdit]);



    const isIdle = agent.state === "idle";
    const isRunning = agent.state === "running" || agent.state === "planning";
    const isPaused = agent.state === "paused";
    const isDone = agent.state === "done" || agent.state === "failed" || agent.state === "stopped";

    const renderPermissionArgs = (tool: string, args: any) => {
        if (tool === "run_cmd") return `$ ${args.command}`;
        if (tool === "write_file" || tool === "create_file") return `$ echo "..." > ${args.path}`;
        if (tool === "delete_file") return `$ rm ${args.path}`;
        if (tool === "read_file") return `$ cat ${args.path}`;
        if (tool === "list_dir") return `$ ls ${args.path || args.dirPath}`;
        if (tool === "search_files") return `$ grep -rn "${args.query}" ${args.path}`;
        return JSON.stringify(args, null, 2);
    };

    const handleStart = () => {
        if (!prompt.trim()) return;

        const context: AgentContext = {
            workspaceRoot,
            currentFile: contextMode === "file" ? activeFile || undefined : undefined,
            selection: contextMode === "selection" ? activeFileContent : undefined,
            folderPath: contextMode === "folder" ? workspaceRoot : undefined,
            wholeRepo: contextMode === "repo",
        };

        const options: Partial<AgentOptions> = {
            autoRunCommands: autoRun,
            autoFixFailures: autoFix,
            autoInstallDeps: autoDeps,
            isPro: isPro,
        };

        if (isPro) {
            agent.start(prompt, context, options);
        } else {
            agent.planOnly(prompt, context);
        }
    };

    if (!sessionId) {
        return (
            <div style={styles.panel}>
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <h3 style={styles.title}>AI Developer</h3>
                    </div>
                </div>
                <div style={styles.disconnectedContainer}>
                    <div style={styles.disconnectedIcon}>🔌</div>
                    <div style={styles.disconnectedText}>
                        Please connect to the Virtual Machine to use the AI Developer.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.panel}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.27a7 7 0 0 1-5.46 3.95 2 2 0 0 1-3.94-1.95A7 7 0 0 1 4.27 19H3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z" />
                    </svg>
                    <span style={styles.title}>AI Developer</span>
                    {!isPro && <span style={styles.freeBadge}>FREE</span>}
                    {isPro && <span style={styles.proBadge}>PRO</span>}
                </div>
            </div>

            {/* Prompt Input */}
            <div style={styles.promptSection}>
                <div style={{ display: "flex", gap: 8, marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <button
                        style={activeTab === "chat" ? { ...styles.tabBtn, ...styles.tabBtnActive } : styles.tabBtn}
                        onClick={() => setActiveTab("chat")}
                    >
                        Active Session
                    </button>
                    <button
                        style={activeTab === "history" ? { ...styles.tabBtn, ...styles.tabBtnActive } : styles.tabBtn}
                        onClick={() => setActiveTab("history")}
                    >
                        History ({agent.history.length})
                    </button>
                </div>

                {activeTab === "chat" ? (
                    <>
                        <textarea
                            style={styles.textarea}
                            placeholder="Describe the change you want to make..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                    e.preventDefault();
                                    handleStart();
                                }
                            }}
                            rows={3}
                            disabled={isRunning || isPaused}
                        />

                        {/* Context selector */}
                        <div style={styles.controlRow}>
                            <select
                                style={styles.select}
                                value={contextMode}
                                onChange={(e) => setContextMode(e.target.value as any)}
                                disabled={isRunning}
                            >
                                <option value="file">Current File</option>
                                <option value="selection">Selection</option>
                                <option value="folder">Folder</option>
                                <option value="repo">Whole Repo</option>
                            </select>

                            {activeFile && contextMode === "file" && (
                                <span style={styles.contextFile}>{activeFile.split("/").pop()}</span>
                            )}
                        </div>

                        {/* Options toggles (Pro only) */}
                        {isPro && (
                            <div style={styles.toggleRow}>
                                <ToggleOption label="Auto-run" checked={autoRun} onChange={setAutoRun} disabled={isRunning} />
                                <ToggleOption label="Auto-fix" checked={autoFix} onChange={setAutoFix} disabled={isRunning} />
                                <ToggleOption label="Auto-deps" checked={autoDeps} onChange={setAutoDeps} disabled={isRunning} />
                            </div>
                        )}

                        {/* Action buttons */}
                        <div style={styles.btnRow}>
                            {(isIdle || isDone) && (
                                <button
                                    style={{
                                        ...styles.btn,
                                        ...styles.btnPrimary,
                                        opacity: !prompt.trim() ? 0.6 : 1,
                                        cursor: !prompt.trim() ? "not-allowed" : "pointer"
                                    }}
                                    onClick={handleStart}
                                    disabled={!prompt.trim()}
                                >
                                    {isPro ? (isDone ? "▶ Follow Up" : "▶ Start") : "🔍 Plan Only"}
                                </button>
                            )}
                            {isRunning && (
                                <>
                                    <button style={{ ...styles.btn, ...styles.btnWarn, padding: "6px 10px" }} onClick={agent.pause} title="Pause">⏸</button>
                                    <button style={{ ...styles.btn, ...styles.btnDanger, padding: "6px 10px" }} onClick={agent.stop} title="Stop">⏹</button>
                                </>
                            )}
                            {isPaused && (
                                <>
                                    <button style={{ ...styles.btn, ...styles.btnPrimary, padding: "6px 10px" }} onClick={agent.resume} title="Resume">▶</button>
                                    <button style={{ ...styles.btn, ...styles.btnDanger, padding: "6px 10px" }} onClick={agent.stop} title="Stop">⏹</button>
                                </>
                            )}
                            {isDone && (
                                <>
                                    {agent.fileChanges.length > 0 && isPro && (
                                        <button style={{ ...styles.btn, ...styles.btnWarn }} onClick={agent.rollback}>↩ Rollback</button>
                                    )}
                                    <button style={{ ...styles.btn, ...styles.btnGhost }} onClick={() => { agent.reset(); setPrompt(""); }}>
                                        New Session
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Free user CTA */}
                        {!isPro && agent.state === "done" && (
                            <div style={styles.ctaBanner}>
                                <span>Want the agent to execute changes, run commands, and auto-fix?</span>
                                <Link href="/pricing" style={styles.ctaLink}>Upgrade to Pro →</Link>
                            </div>
                        )}

                        {/* Permission Prompt Card moved to prompt section so it's always visible */}
                        {agent.state === "awaiting_permission" && agent.pendingPermission && (
                            <div style={styles.permissionCard}>
                                <div style={styles.permissionHeader}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f0c040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    <span>System Access Required</span>
                                </div>
                                <div style={styles.permissionText}>
                                    The agent wants to perform an action outside the safe sandbox:
                                    <br />
                                    <strong>Reason:</strong> {agent.pendingPermission.reason}
                                </div>
                                <div style={styles.permissionDetails}>
                                    <strong>Tool:</strong> {agent.pendingPermission.tool}
                                    <br />
                                    <strong>Args:</strong>
                                    <pre style={styles.permissionArgs}>
                                        {renderPermissionArgs(agent.pendingPermission.tool, agent.pendingPermission.args)}
                                    </pre>
                                </div>
                                <div style={styles.permissionBtnRow}>
                                    <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={agent.grantPermission}>
                                        Allow Once
                                    </button>
                                    <button style={{ ...styles.btn, ...styles.btnGhost }} onClick={agent.denyPermission}>
                                        Deny
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, overflowY: "auto", paddingRight: 4 }}>
                        {agent.history.length === 0 ? (
                            <div style={styles.emptyState}>No past sessions found.</div>
                        ) : (
                            agent.history.map((h) => (
                                <div key={h.id} style={{ padding: 12, background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 8 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                                            {new Date(h.startedAt).toLocaleString()}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <StatusDot state={h.state} />
                                            <span style={{ fontSize: 11, textTransform: "capitalize", color: "var(--text-secondary)" }}>
                                                {h.state}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-bright)", marginBottom: 8, wordBreak: "break-word" }}>
                                        {h.promptText}
                                    </div>
                                    {h.summary && (
                                        <div style={{ fontSize: 12, color: "var(--text-secondary)", background: "rgba(0,0,0,0.15)", padding: "6px 8px", borderRadius: 4, marginBottom: 8 }}>
                                            {h.summary}
                                        </div>
                                    )}
                                    <div style={{ textAlign: "right" }}>
                                        <button
                                            style={{ ...styles.btn, ...styles.btnGhost, padding: "4px 8px", fontSize: 11, color: "#ff6b6b", borderColor: "rgba(255,107,107,0.3)" }}
                                            onClick={() => agent.deleteHistory(h.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

            </div>

            {/* Status badge */}
            {agent.state !== "idle" && (
                <div style={styles.statusBar}>
                    <StatusDot state={agent.state} />
                    <span style={styles.statusText}>
                        {agent.state === "planning" && "Planning..."}
                        {agent.state === "running" && "Executing..."}
                        {agent.state === "awaiting_permission" && "Awaiting Permission"}
                        {agent.state === "paused" && "Paused"}
                        {agent.state === "done" && "Completed"}
                        {agent.state === "failed" && "Failed"}
                        {agent.state === "stopped" && "Stopped"}
                        {agent.state === "rolling_back" && "Rolling back..."}
                    </span>
                    {agent.fileChanges.length > 0 && (
                        <span style={styles.fileCount}>{agent.fileChanges.length} files</span>
                    )}
                </div>
            )}

            {/* Log timeline */}
            <div style={styles.logs}>
                {agent.logs.length === 0 && agent.state === "idle" && (
                    <div style={styles.emptyState}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2, marginBottom: 8 }}>
                            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.27a7 7 0 0 1-5.46 3.95 2 2 0 0 1-3.94-1.95A7 7 0 0 1 4.27 19H3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z" />
                        </svg>
                        <div>Describe a code change and press Start</div>
                        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
                            The AI agent will edit files, run commands, and fix errors automatically
                        </div>
                    </div>
                )}



                {agent.logs.map((log) => (
                    <LogItem key={log.id} log={log} />
                ))}

                {/* Summary card */}
                {agent.summary && agent.state === "done" && (
                    <div style={styles.summaryCard}>
                        <div style={styles.summaryTitle}>✅ Summary</div>
                        <div style={styles.summaryText}>{agent.summary}</div>
                        {agent.fileChanges.length > 0 && (
                            <div style={styles.fileList}>
                                {agent.fileChanges.map((f, i) => (
                                    <div key={i} style={styles.fileItem}>
                                        <span style={styles.fileAction}>
                                            {f.action === "created" && "➕"}
                                            {f.action === "modified" && "✏️"}
                                            {f.action === "deleted" && "🗑️"}
                                            {f.action === "renamed" && "📛"}
                                        </span>
                                        {f.path.split("/").pop()}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Error display */}
                {agent.error && agent.state === "failed" && (
                    <div style={styles.errorCard}>
                        <div style={styles.errorTitle}>❌ Error</div>
                        <div style={styles.errorText}>{agent.error}</div>
                    </div>
                )}

                <div ref={logsEndRef} />
            </div>
        </div>
    );
}

// ─── Sub-components ──────────────────────────────────────────────

function ToggleOption({
    label,
    checked,
    onChange,
    disabled,
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <label style={{ ...styles.toggle, opacity: disabled ? 0.5 : 1 }}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                style={{ accentColor: "var(--accent)" }}
            />
            <span style={styles.toggleLabel}>{label}</span>
        </label>
    );
}

function StatusDot({ state }: { state: AgentState }) {
    const colors: Record<string, string> = {
        planning: "#f0c040",
        running: "#06b6d4",
        awaiting_permission: "#f0c040",
        paused: "#f0c040",
        done: "#51cf66",
        failed: "#ff6b6b",
        stopped: "var(--text-secondary)",
        rolling_back: "#f0c040",
    };
    const color = colors[state] || "var(--text-secondary)";
    const pulse = state === "running" || state === "planning";

    return (
        <span
            style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
                display: "inline-block",
                flexShrink: 0,
                animation: pulse ? "pulse 1.5s ease-in-out infinite" : "none",
            }}
        />
    );
}

function LogItem({ log }: { log: AgentLogEntry }) {
    const colorMap: Record<string, string> = {
        text: "var(--text-primary)",
        tool: "#06b6d4",
        cmd: "#51cf66",
        error: "#ff6b6b",
        plan: "#a78bfa",
        edit: "#f0c040",
        file_event: "#f0c040",
    };

    return (
        <div style={styles.logItem}>
            <span style={{ ...styles.logDot, background: colorMap[log.type] || "var(--text-secondary)" }} />
            <pre style={styles.logContent}>{log.content}</pre>
        </div>
    );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
    panel: {
        width: "100%",
        height: "100%",
        background: "var(--bg-secondary)",
        display: "flex",
        flexDirection: "row", // Split left (input) and right (logs)
        overflow: "hidden",
    },
    header: {
        display: "none", // Hide the header since the bottom tabs are already clear
    },
    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: 600,
        color: "var(--text-primary)",
    },
    proBadge: {
        fontSize: 9,
        fontWeight: 700,
        padding: "2px 6px",
        borderRadius: 4,
        background: "rgba(6, 182, 212, 0.15)",
        color: "var(--accent)",
        letterSpacing: 0.5,
    },
    freeBadge: {
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 6px",
        background: "rgba(255, 107, 107, 0.2)",
        color: "#ff6b6b",
        border: "1px solid rgba(255, 107, 107, 0.4)",
        borderRadius: 10,
    },
    promptSection: {
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        borderRight: "1px solid var(--border)",
        width: "35%", // Take 35% of the bottom tab width
        minWidth: 300,
        flexShrink: 0,
        overflowY: "auto",
    },
    textarea: {
        width: "100%",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        color: "var(--text-bright)",
        fontSize: 13,
        padding: "8px 10px",
        resize: "vertical",
        fontFamily: "inherit",
        outline: "none",
    },
    controlRow: {
        display: "flex",
        alignItems: "center",
        gap: 8,
    },
    select: {
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 4,
        color: "var(--text-primary)",
        fontSize: 11,
        padding: "4px 8px",
        outline: "none",
    },
    contextFile: {
        fontSize: 11,
        color: "var(--text-secondary)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    toggleRow: {
        display: "flex",
        gap: 12,
    },
    toggle: {
        display: "flex",
        alignItems: "center",
        gap: 4,
        cursor: "pointer",
    },
    toggleLabel: {
        fontSize: 11,
        color: "var(--text-secondary)",
    },
    btnRow: {
        display: "flex",
        gap: 6,
    },
    btn: {
        padding: "6px 12px",
        borderRadius: 5,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        border: "none",
        transition: "all 0.15s",
    },
    btnPrimary: {
        background: "var(--accent)",
        color: "#000",
    },
    btnWarn: {
        background: "rgba(240, 192, 64, 0.15)",
        color: "#f0c040",
        border: "1px solid rgba(240, 192, 64, 0.3)",
    },
    btnDanger: {
        background: "rgba(255, 107, 107, 0.15)",
        color: "#ff6b6b",
        border: "1px solid rgba(255, 107, 107, 0.3)",
    },
    btnGhost: {
        background: "transparent",
        color: "var(--text-secondary)",
        border: "1px solid var(--border)",
    },
    ctaBanner: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "8px 12px",
        background: "rgba(6, 182, 212, 0.05)",
        border: "1px solid rgba(6, 182, 212, 0.15)",
        borderRadius: 6,
        fontSize: 12,
        color: "var(--text-secondary)",
    },
    ctaLink: {
        color: "var(--accent)",
        fontWeight: 600,
        textDecoration: "none",
        fontSize: 12,
    },
    statusBar: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
    },
    statusText: {
        fontSize: 12,
        color: "var(--text-secondary)",
        fontWeight: 500,
    },
    fileCount: {
        marginLeft: "auto",
        fontSize: 11,
        color: "var(--accent)",
        fontWeight: 600,
    },
    logSection: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        background: "var(--bg-primary)",
    },
    logs: {
        flex: 1,
        overflow: "auto",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 4,
    },
    emptyState: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "var(--text-secondary)",
        fontSize: 13,
        textAlign: "center",
    },
    logItem: {
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        padding: "4px 0",
    },
    logDot: {
        width: 6,
        height: 6,
        borderRadius: "50%",
        flexShrink: 0,
        marginTop: 5,
    },
    logContent: {
        fontSize: 12,
        color: "var(--text-primary)",
        margin: 0,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        lineHeight: 1.5,
    },
    summaryCard: {
        padding: 12,
        background: "rgba(81, 207, 102, 0.08)",
        border: "1px solid rgba(81, 207, 102, 0.2)",
        borderRadius: 8,
        marginTop: 8,
    },
    summaryTitle: {
        fontSize: 13,
        fontWeight: 600,
        color: "#51cf66",
        marginBottom: 6,
    },
    summaryText: {
        fontSize: 12,
        color: "var(--text-primary)",
        lineHeight: 1.5,
    },
    fileList: {
        marginTop: 8,
        display: "flex",
        flexDirection: "column",
        gap: 2,
    },
    fileItem: {
        display: "flex",
        gap: 6,
        fontSize: 11,
        color: "var(--text-secondary)",
        fontFamily: "monospace",
    },
    fileAction: {
        flexShrink: 0,
    },
    errorCard: {
        padding: 12,
        background: "rgba(255, 107, 107, 0.08)",
        border: "1px solid rgba(255, 107, 107, 0.2)",
        borderRadius: 8,
        marginTop: 8,
    },
    errorTitle: {
        fontSize: 13,
        fontWeight: 600,
        color: "#ff6b6b",
        marginBottom: 6,
    },
    errorText: {
        fontSize: 12,
        color: "var(--text-primary)",
        lineHeight: 1.5,
        fontFamily: "monospace",
    },
    permissionCard: {
        padding: 12,
        background: "rgba(240, 192, 64, 0.08)",
        border: "1px solid rgba(240, 192, 64, 0.4)",
        borderRadius: 8,
        marginBottom: 8,
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    permissionHeader: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "#f0c040",
        fontWeight: 600,
        fontSize: 13,
    },
    permissionText: {
        color: "var(--text-primary)",
        fontSize: 12,
        lineHeight: 1.4,
    },
    permissionDetails: {
        background: "rgba(0, 0, 0, 0.2)",
        padding: 8,
        borderRadius: 4,
        fontSize: 11,
        color: "var(--text-secondary)",
        fontFamily: "'JetBrains Mono', monospace",
        overflowX: "auto",
    },
    permissionArgs: {
        margin: "4px 0 0 0",
        whiteSpace: "pre-wrap",
        color: "var(--text-bright)",
    },
    permissionBtnRow: {
        display: "flex",
        gap: 8,
        marginTop: 4,
    },
    tabBtn: {
        background: "transparent",
        color: "var(--text-secondary)",
        border: "none",
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        borderRadius: 4,
        transition: "all 0.2s",
    },
    tabBtnActive: {
        background: "rgba(6, 182, 212, 0.15)",
        color: "var(--accent)",
        fontWeight: 600,
    },
    disconnectedContainer: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        color: "var(--text-secondary)",
        minHeight: 200,
    },
    disconnectedIcon: {
        fontSize: 32,
        marginBottom: 16,
        opacity: 0.5,
    },
    disconnectedText: {
        fontSize: 14,
        textAlign: "center" as const,
        maxWidth: 250,
        lineHeight: 1.5,
    },
};
