import { AgentSession, AgentContext, AgentOptions } from "../types";
import { EventEmitter } from "./agentAI";
export declare class AgentOrchestrator {
    /**
     * Create a new agent session and start processing.
     */
    startSession(sshSessionId: string, prompt: string, context: AgentContext, options: Partial<AgentOptions>, emit: EventEmitter): Promise<AgentSession>;
    /**
     * Pause a running session.
     */
    pauseSession(sessionId: string): void;
    /**
     * Resume a paused session.
     */
    resumeSession(sessionId: string): void;
    /**
     * Grant pending system permission.
     */
    grantPermission(sessionId: string): void;
    /**
     * Deny pending system permission.
     */
    denyPermission(sessionId: string): void;
    /**
     * Stop a running session.
     */
    stopSession(sessionId: string): void;
    /**
     * Rollback all changes made by the agent session.
     */
    rollbackSession(sessionId: string): Promise<{
        restoredFiles: string[];
    }>;
    /**
     * Get session state.
     */
    getSession(sessionId: string): AgentSession | undefined;
    /**
     * Get summarized session history for a workspace wrapper.
     */
    getSessionHistory(sshSessionId: string): any[];
    /**
     * Delete a session from memory.
     */
    deleteSession(sessionId: string, sshSessionId: string): void;
    /**
     * Generate plan only (for free users).
     */
    planOnly(sshSessionId: string, prompt: string, context: AgentContext): Promise<string>;
    /**
     * Continue a finished session with a new follow-up prompt.
     */
    continueSession(sessionId: string, prompt: string, context: AgentContext, emit: EventEmitter): Promise<void>;
    private runAgentLoop;
    /**
     * Read context files and build a context string for the AI.
     */
    private buildContextInfo;
}
export declare const agentOrchestrator: AgentOrchestrator;
//# sourceMappingURL=agentOrchestrator.d.ts.map