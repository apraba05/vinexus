"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { getSessionWsUrl, AgentContext, AgentOptions, AgentState, AgentFileChange, AgentSession, getAgentHistory, deleteAgentSession } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────

export interface AgentLogEntry {
    id: string;
    type: "text" | "tool" | "cmd" | "error" | "plan" | "edit" | "file_event";
    content: string;
    timestamp: number;
    meta?: Record<string, any>;
}

export interface AgentSessionState {
    state: AgentState;
    logs: AgentLogEntry[];
    fileChanges: AgentFileChange[];
    summary: string | null;
    error: string | null;
}

// ─── Hook ────────────────────────────────────────────────────────

export function useAgentSession(sessionId: string | null) {
    const [agentState, setAgentState] = useState<AgentState>("idle");
    const [logs, setLogs] = useState<AgentLogEntry[]>([]);
    const [fileChanges, setFileChanges] = useState<AgentFileChange[]>([]);
    const [summary, setSummary] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [plan, setPlan] = useState<string | null>(null);
    const [pendingPermission, setPendingPermission] = useState<AgentSession["pendingPermission"] | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    const fetchHistory = useCallback(async () => {
        if (!sessionId) return;
        try {
            const data = await getAgentHistory(sessionId);
            setHistory(data);
        } catch (err) {
            console.error("Failed to fetch agent history:", err);
        }
    }, [sessionId]);

    const deleteHistory = useCallback(async (agentSessionId: string) => {
        if (!sessionId) return;
        try {
            await deleteAgentSession(agentSessionId, sessionId);
            await fetchHistory();
        } catch (err) {
            console.error("Failed to delete agent session:", err);
        }
    }, [sessionId, fetchHistory]);

    const wsRef = useRef<WebSocket | null>(null);
    const logIdRef = useRef(0);

    const addLog = useCallback((type: AgentLogEntry["type"], content: string, meta?: Record<string, any>) => {
        const id = `log_${++logIdRef.current}`;
        setLogs((prev) => [...prev, { id, type, content, timestamp: Date.now(), meta }]);
    }, []);

    // Send a message on the agent channel
    const sendAgent = useCallback((type: string, payload: any = {}) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ channel: "agent", type, payload }));
    }, []);

    // Connect to the multiplexed WS (shared with terminal/exec/deploy)
    useEffect(() => {
        if (!sessionId) return;

        const wsUrl = getSessionWsUrl(sessionId);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            let msg: { channel: string; type: string; payload: any };
            try {
                msg = JSON.parse(event.data);
            } catch {
                return;
            }

            if (msg.channel !== "agent") return;

            switch (msg.type) {
                case "session_created":
                    setAgentState(msg.payload.state || "planning");
                    break;
                case "state_change":
                    setAgentState(msg.payload.state);
                    if (msg.payload.state !== "awaiting_permission") {
                        setPendingPermission(null);
                    }
                    break;
                case "permission_required":
                    setAgentState("awaiting_permission");
                    setPendingPermission(msg.payload);
                    addLog("text", `⚠️ Agent paused awaiting permission: ${msg.payload.reason}`);
                    break;
                case "plan":
                    setPlan(msg.payload.plan || msg.payload.status);
                    addLog("plan", msg.payload.plan || msg.payload.status || "Planning...");
                    break;
                case "agent_text":
                    addLog("text", msg.payload.text);
                    break;
                case "tool_start":
                    addLog("tool", `⚡ ${msg.payload.tool}(${JSON.stringify(msg.payload.args).slice(0, 120)})`, {
                        tool: msg.payload.tool,
                        toolId: msg.payload.toolId,
                    });
                    break;
                case "tool_complete":
                    addLog("tool", `✓ ${msg.payload.tool} completed`, {
                        tool: msg.payload.tool,
                        toolId: msg.payload.toolId,
                    });
                    break;
                case "tool_error":
                    addLog("error", `✗ ${msg.payload.tool}: ${msg.payload.error}`, {
                        tool: msg.payload.tool,
                    });
                    break;
                case "edit_delta":
                    addLog("edit", `📝 ${msg.payload.path}`, {
                        path: msg.payload.path,
                        content: msg.payload.content,
                    });
                    setFileChanges((prev) => {
                        const existing = prev.find((f) => f.path === msg.payload.path);
                        if (existing) return prev;
                        return [...prev, { path: msg.payload.path, action: "modified" }];
                    });
                    break;
                case "file_created":
                    addLog("file_event", `📄 Created ${msg.payload.path}`, { path: msg.payload.path });
                    setFileChanges((prev) => [...prev, { path: msg.payload.path, action: "created" }]);
                    break;
                case "file_deleted":
                    addLog("file_event", `🗑️ Deleted ${msg.payload.path}`, { path: msg.payload.path });
                    setFileChanges((prev) => [...prev, { path: msg.payload.path, action: "deleted" }]);
                    break;
                case "cmd_start":
                    addLog("cmd", `$ ${msg.payload.command}`, { command: msg.payload.command });
                    break;
                case "cmd_complete":
                    {
                        const exitCode = msg.payload.exitCode;
                        const icon = exitCode === 0 ? "✓" : "✗";
                        const output = msg.payload.stdout || msg.payload.stderr || "";
                        addLog("cmd", `${icon} Exit ${exitCode} (${msg.payload.durationMs}ms)\n${output.slice(0, 500)}`, {
                            exitCode,
                        });
                    }
                    break;
                case "error":
                    setError(msg.payload.error);
                    if (msg.payload.fatal) {
                        setAgentState("failed");
                    }
                    addLog("error", msg.payload.error);
                    break;
                case "done":
                    setAgentState("done");
                    setSummary(msg.payload.summary);
                    setFileChanges(msg.payload.filesChanged ? [] : []); // refresh from payload
                    addLog("text", `✅ ${msg.payload.summary || "Done"}`);
                    break;
                case "rollback_complete":
                    setAgentState("idle");
                    setFileChanges([]);
                    addLog("text", `↩️ Rolled back ${msg.payload.restoredFiles?.length || 0} files`);
                    break;
            }
        };

        return () => {
            // Don't close the WS — it's shared with other channels
            // The multiplexer handles cleanup
        };
    }, [sessionId, addLog]);

    // ─── Actions ─────────────────────────────────────────────────

    const start = useCallback(
        (prompt: string, context: AgentContext, options?: Partial<AgentOptions>) => {
            setLogs([]);
            setFileChanges([]);
            setSummary(null);
            setError(null);
            setPlan(null);
            setPendingPermission(null);
            setAgentState("planning");

            sendAgent("start", { prompt, context, options });
        },
        [sendAgent]
    );

    const pause = useCallback(() => {
        sendAgent("pause");
    }, [sendAgent]);

    const resume = useCallback(() => {
        sendAgent("resume");
    }, [sendAgent]);

    const stop = useCallback(() => {
        sendAgent("stop");
    }, [sendAgent]);

    const rollback = useCallback(() => {
        sendAgent("rollback");
    }, [sendAgent]);

    const planOnly = useCallback(
        (prompt: string, context: AgentContext) => {
            setLogs([]);
            setPlan(null);
            setPendingPermission(null);
            setAgentState("planning");

            sendAgent("plan_only", { prompt, context });
        },
        [sendAgent]
    );

    const reset = useCallback(() => {
        setAgentState("idle");
        setLogs([]);
        setFileChanges([]);
        setSummary(null);
        setError(null);
        setPlan(null);
        setPendingPermission(null);
        sendAgent("reset");
    }, [sendAgent]);

    const grantPermission = useCallback(() => {
        setPendingPermission(null);
        setAgentState("running");
        addLog("text", "✅ Permission granted by user. Resuming...");
        sendAgent("grant_permission");
    }, [sendAgent, addLog]);

    const denyPermission = useCallback(() => {
        setPendingPermission(null);
        setAgentState("running");
        addLog("text", "❌ Permission denied by user. Resuming to handle rejection...");
        sendAgent("deny_permission");
    }, [sendAgent, addLog]);

    return {
        state: agentState,
        logs,
        fileChanges,
        summary,
        error,
        plan,
        start,
        pause,
        resume,
        stop,
        rollback,
        planOnly,
        reset,
        pendingPermission,
        grantPermission,
        denyPermission,
        history,
        fetchHistory,
        deleteHistory,
    };
}
