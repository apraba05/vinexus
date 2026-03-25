export type ToolExecutor = (toolName: string, args: Record<string, any>) => Promise<any>;
export type EventEmitter = (type: string, data: any) => void;
export declare class AgentAI {
    private client;
    private modelId;
    private messages;
    private aborted;
    constructor();
    abort(): void;
    isAborted(): boolean;
    /**
     * Run the agent loop: send prompt, process tool calls, repeat until done.
     * Emits events via the emitter callback for real-time streaming to frontend.
     */
    run(prompt: string, contextInfo: string, executeTool: ToolExecutor, emit: EventEmitter, isContinuation?: boolean): Promise<{
        summary: string;
        success: boolean;
    }>;
    /**
     * Generate a plan only (no tool execution) for free users.
     */
    planOnly(prompt: string, contextInfo: string): Promise<string>;
    private converse;
    private callWithRetry;
}
//# sourceMappingURL=agentAI.d.ts.map