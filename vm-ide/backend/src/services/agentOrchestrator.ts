import { v4 as uuidv4 } from "uuid";
import {
    AgentSession,
    AgentState,
    AgentContext,
    AgentOptions,
    AgentStep,
    AgentToolCall,
} from "../types";
import { AgentTools, checkToolPermission } from "./agentTools";
import { AgentAI, EventEmitter } from "./agentAI";
import { getSession } from "../sessionStore";
import { sftpReadFile, sftpStat } from "../types";

// ─── Constants ───────────────────────────────────────────────────

const MAX_CONCURRENT_SESSIONS = 10;
const MAX_DAILY_SESSIONS_PRO = 15;
const MAX_DAILY_SESSIONS_FREE = 2;
const MAX_RETRIES = 3;

// ─── Session Store ───────────────────────────────────────────────

const agentSessions = new Map<string, AgentSession>();
const agentAIs = new Map<string, AgentAI>();
const agentToolInstances = new Map<string, AgentTools>();

// ─── Orchestrator ────────────────────────────────────────────────

export class AgentOrchestrator {

    /**
     * Create a new agent session and start processing.
     */
    async startSession(
        sshSessionId: string,
        prompt: string,
        context: AgentContext,
        options: Partial<AgentOptions>,
        emit: EventEmitter,
    ): Promise<AgentSession> {
        // Verify SSH session
        const sshSession = getSession(sshSessionId);
        if (!sshSession) {
            throw new Error("SSH session not found");
        }

        // Limit concurrent sessions and enforce Free/Pro daily limits
        let activeSessions = 0;
        let pastSessionsForUser = 0;
        let past24hSessionsForUser = 0;
        const now = Date.now();
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;

        for (const s of agentSessions.values()) {
            if (s.state === "running" || s.state === "planning") activeSessions++;
            if (s.sshSessionId === sshSessionId) {
                pastSessionsForUser++;
                if (now - s.startedAt < ONE_DAY_MS) {
                    past24hSessionsForUser++;
                }
            }
        }

        if (activeSessions >= MAX_CONCURRENT_SESSIONS) {
            throw new Error("Too many active agent sessions globally. Please try again later.");
        }

        if (!options.isPro && past24hSessionsForUser >= MAX_DAILY_SESSIONS_FREE) {
            throw new Error(`Free tier daily limit reached. You can run up to ${MAX_DAILY_SESSIONS_FREE} Agent sessions per 24 hours. Upgrade to Pro for more.`);
        }

        if (options.isPro && past24hSessionsForUser >= MAX_DAILY_SESSIONS_PRO) {
            throw new Error(`Pro daily limit reached. You can run up to ${MAX_DAILY_SESSIONS_PRO} Agent sessions per 24 hours.`);
        }

        const sessionId = uuidv4();
        const session: AgentSession = {
            id: sessionId,
            sshSessionId,
            state: "planning",
            prompt,
            context,
            steps: [],
            toolCalls: [],
            fileChanges: [],
            options: {
                autoRunCommands: options.autoRunCommands ?? true,
                autoFixFailures: options.autoFixFailures ?? true,
                autoInstallDeps: options.autoInstallDeps ?? true,
            },
            startedAt: Date.now(),
            retryCount: 0,
            maxRetries: MAX_RETRIES,
        };

        agentSessions.set(sessionId, session);

        // Create tool and AI instances
        const tools = new AgentTools(sshSessionId, context.workspaceRoot);
        const ai = new AgentAI();
        agentToolInstances.set(sessionId, tools);
        agentAIs.set(sessionId, ai);

        // Build context info from selected files/folder
        const contextInfo = await this.buildContextInfo(sshSessionId, context);

        // Start the agent loop in the background
        this.runAgentLoop(sessionId, contextInfo, emit, prompt, false).catch((err) => {
            console.error(`[agent] Session ${sessionId} failed:`, err.message);
            session.state = "failed";
            session.error = err.message;
            session.completedAt = Date.now();
            emit("error", { error: err.message, fatal: true });
        });

        emit("session_created", { sessionId, state: session.state });
        return session;
    }

    /**
     * Pause a running session.
     */
    pauseSession(sessionId: string): void {
        const session = agentSessions.get(sessionId);
        if (!session) throw new Error("Agent session not found");
        if (session.state !== "running") throw new Error("Session is not running");
        session.state = "paused";
    }

    /**
     * Resume a paused session.
     */
    resumeSession(sessionId: string): void {
        const session = agentSessions.get(sessionId);
        if (!session) throw new Error("Agent session not found");
        if (session.state === "awaiting_permission") throw new Error("Cannot resume. Session is awaiting user permission.");
        if (session.state !== "paused") throw new Error("Session is not paused");
        session.state = "running";
    }

    /**
     * Grant pending system permission.
     */
    grantPermission(sessionId: string): void {
        const session = agentSessions.get(sessionId);
        if (!session) throw new Error("Agent session not found");
        if (session.state !== "awaiting_permission") throw new Error("Session is not awaiting permission");

        if (session.pendingPermission) {
            session.pendingPermission.decision = "granted";
        }
        session.state = "running";
    }

    /**
     * Deny pending system permission.
     */
    denyPermission(sessionId: string): void {
        const session = agentSessions.get(sessionId);
        if (!session) throw new Error("Agent session not found");
        if (session.state !== "awaiting_permission") throw new Error("Session is not awaiting permission");

        if (session.pendingPermission) {
            session.pendingPermission.decision = "denied";
        }
        session.state = "running"; // the tool loop will pick this up and throw
    }

    /**
     * Stop a running session.
     */
    stopSession(sessionId: string): void {
        const session = agentSessions.get(sessionId);
        if (!session) throw new Error("Agent session not found");

        const ai = agentAIs.get(sessionId);
        if (ai) ai.abort();

        session.state = "stopped";
        session.completedAt = Date.now();
    }

    /**
     * Rollback all changes made by the agent session.
     */
    async rollbackSession(sessionId: string): Promise<{ restoredFiles: string[] }> {
        const session = agentSessions.get(sessionId);
        if (!session) throw new Error("Agent session not found");

        session.state = "rolling_back";

        const tools = agentToolInstances.get(sessionId);
        if (!tools) throw new Error("Agent tools not found");

        const result = await tools.rollbackAll();

        session.state = "stopped";
        session.completedAt = Date.now();

        return result;
    }

    /**
     * Get session state.
     */
    getSession(sessionId: string): AgentSession | undefined {
        return agentSessions.get(sessionId);
    }

    /**
     * Get summarized session history for a workspace wrapper.
     */
    getSessionHistory(sshSessionId: string) {
        const history: any[] = [];
        for (const session of agentSessions.values()) {
            if (session.sshSessionId === sshSessionId) {
                history.push({
                    id: session.id,
                    state: session.state,
                    summary: session.summary,
                    startedAt: session.startedAt,
                    completedAt: session.completedAt,
                    promptText: session.prompt,
                });
            }
        }
        return history.sort((a, b) => b.startedAt - a.startedAt); // descending
    }

    /**
     * Delete a session from memory.
     */
    deleteSession(sessionId: string, sshSessionId: string): void {
        const session = agentSessions.get(sessionId);
        if (session && session.sshSessionId === sshSessionId) {
            agentSessions.delete(sessionId);
            agentAIs.delete(sessionId);
            agentToolInstances.delete(sessionId);
        }
    }

    /**
     * Generate plan only (for free users).
     */
    async planOnly(sshSessionId: string, prompt: string, context: AgentContext): Promise<string> {
        const contextInfo = await this.buildContextInfo(sshSessionId, context);
        const ai = new AgentAI();
        return ai.planOnly(prompt, contextInfo);
    }

    /**
     * Continue a finished session with a new follow-up prompt.
     */
    async continueSession(
        sessionId: string,
        prompt: string,
        context: AgentContext,
        emit: EventEmitter
    ): Promise<void> {
        const session = agentSessions.get(sessionId);
        if (!session) throw new Error("Agent session not found");
        if (session.state !== "done" && session.state !== "failed" && session.state !== "stopped") {
            throw new Error(`Cannot continue session in state: ${session.state}`);
        }

        const ai = agentAIs.get(sessionId);
        if (!ai) throw new Error("Agent AI instance not found");

        const contextInfo = await this.buildContextInfo(session.sshSessionId, context);

        session.state = "planning";
        session.completedAt = undefined;
        session.error = undefined;
        session.pendingPermission = undefined;
        session.prompt = prompt;

        this.runAgentLoop(sessionId, contextInfo, emit, prompt, true).catch((err) => {
            console.error(`[agent] Session continuation ${sessionId} failed:`, err.message);
            session.state = "failed";
            session.error = err.message;
            session.completedAt = Date.now();
            emit("error", { error: err.message, fatal: true });
        });

        emit("state_change", { state: session.state });
    }

    // ─── Private ───────────────────────────────────────────────────

    private async runAgentLoop(
        sessionId: string,
        contextInfo: string,
        emit: EventEmitter,
        prompt: string,
        isContinuation: boolean = false
    ): Promise<void> {
        const session = agentSessions.get(sessionId);
        if (!session) return;

        const tools = agentToolInstances.get(sessionId);
        const ai = agentAIs.get(sessionId);
        if (!tools || !ai) return;

        session.state = "running";
        emit("state_change", { state: "running" });

        // Define the tool executor that bridges AI tool calls to actual tool implementations
        const executeTool = async (toolName: string, args: Record<string, any>): Promise<any> => {
            // Wait while paused
            while (session.state === "paused") {
                await new Promise((r) => setTimeout(r, 500));
                if (session.state !== "paused") break; // state changed externally (stopped, etc.)
            }

            if (session.state === "stopped") throw new Error("Session stopped");

            // Check if this tool requires explicit permission
            const permCheck = checkToolPermission(
                toolName,
                args,
                session.context.workspaceRoot,
                session.options.autoRunCommands ?? true
            );

            if (permCheck.requiresPermission) {
                session.pendingPermission = {
                    tool: toolName,
                    args,
                    reason: permCheck.reason || "System access required",
                };
                session.state = "awaiting_permission";
                emit("permission_required", session.pendingPermission);

                // Wait for user decision
                while (session.state === "awaiting_permission") {
                    await new Promise(r => setTimeout(r, 500));
                    if (session.state !== "awaiting_permission") break;
                }

                if (session.state === "stopped") throw new Error("Session stopped while awaiting permission");

                if (session.pendingPermission?.decision === "denied") {
                    const reason = session.pendingPermission.reason;
                    session.pendingPermission = undefined;
                    throw new Error(`User denied permission. Reason: ${reason}`);
                }

                // If granted, clear pending state
                session.pendingPermission = undefined;
            }

            const toolCall: AgentToolCall = {
                id: uuidv4(),
                tool: toolName,
                args,
            };

            const startTime = Date.now();

            try {
                let result: any;
                const opts = { allowSystemAccess: true }; // since we checked permissions above

                switch (toolName) {
                    case "list_dir":
                        result = await tools.listDir(args.path, opts);
                        break;
                    case "read_file":
                        result = await tools.readFile(args.path, opts);
                        break;
                    case "write_file":
                        result = await tools.writeFile(args.path, args.content, opts);
                        // Emit edit delta for live editor updates
                        emit("edit_delta", {
                            path: args.path,
                            content: args.content,
                            action: "write",
                        });
                        break;
                    case "create_file":
                        result = await tools.createFile(args.path, args.content, opts);
                        emit("file_created", { path: args.path, content: args.content });
                        break;
                    case "delete_file":
                        result = await tools.deleteFile(args.path, opts);
                        emit("file_deleted", { path: args.path });
                        break;
                    case "search_files":
                        result = await tools.searchFiles(args.query, args.path, opts);
                        break;
                    case "run_cmd":
                        emit("cmd_start", { command: args.command, cwd: args.cwd });
                        result = await tools.runCmd(args.command, args.cwd, opts);
                        emit("cmd_complete", {
                            command: args.command,
                            exitCode: result.exitCode,
                            stdout: result.stdout,
                            stderr: result.stderr,
                            durationMs: result.durationMs,
                        });
                        break;
                    default:
                        throw new Error(`Unknown tool: ${toolName}`);
                }

                toolCall.result = result;
                toolCall.durationMs = Date.now() - startTime;
                session.toolCalls.push(toolCall);

                return result;
            } catch (err: any) {
                toolCall.error = err.message;
                toolCall.durationMs = Date.now() - startTime;
                session.toolCalls.push(toolCall);
                throw err;
            }
        };

        try {
            const result = await ai.run(prompt, contextInfo, executeTool, emit, isContinuation);

            session.state = result.success ? "done" : "failed";
            session.summary = result.summary;
            session.fileChanges = tools.getFileChanges();
            session.completedAt = Date.now();

            emit("done", {
                summary: result.summary,
                success: result.success,
                filesChanged: session.fileChanges.length,
                toolCalls: session.toolCalls.length,
            });
        } catch (err: any) {
            session.state = "failed";
            session.error = err.message;
            session.completedAt = Date.now();
            emit("error", { error: err.message, fatal: true });
        }
    }

    /**
     * Read context files and build a context string for the AI.
     */
    private async buildContextInfo(sshSessionId: string, context: AgentContext): Promise<string> {
        const parts: string[] = [];

        const sshSession = getSession(sshSessionId);
        if (!sshSession) return "";

        // Read current file if specified
        if (context.currentFile) {
            try {
                const stats = await sftpStat(sshSession.sftp, context.currentFile);
                if (stats.size < 100_000) {
                    const buf = await sftpReadFile(sshSession.sftp, context.currentFile);
                    parts.push(`Current file (${context.currentFile}):\n\`\`\`\n${buf.toString("utf-8")}\n\`\`\``);
                }
            } catch {
                // File may not exist
            }
        }

        // Add selection if provided
        if (context.selection) {
            parts.push(`Selected code:\n\`\`\`\n${context.selection}\n\`\`\``);
        }

        parts.push(`Workspace root: ${context.workspaceRoot}`);

        return parts.join("\n\n");
    }
}

export const agentOrchestrator = new AgentOrchestrator();
