import { CommandTemplate, CommandResult } from "../types";
export declare class CommandRunner {
    private templates;
    constructor();
    /**
     * Get all available command templates.
     */
    getTemplates(): CommandTemplate[];
    /**
     * Get a specific template by ID.
     */
    getTemplate(id: string): CommandTemplate | undefined;
    /**
     * Register a custom command template (from .vmide.json).
     */
    registerTemplate(template: CommandTemplate): void;
    /**
     * Execute a predefined command template with validated parameters.
     */
    runTemplate(sessionId: string, templateId: string, params: Record<string, string | number>): Promise<CommandResult>;
    /**
     * Execute a custom command (from .vmide.json custom commands).
     * Requires explicit confirmation flag.
     */
    runCustom(sessionId: string, command: string, sudo?: boolean, timeout?: number): Promise<CommandResult>;
    /**
     * Replace {param} placeholders with validated values.
     */
    private interpolateCommand;
}
export declare const commandRunner: CommandRunner;
//# sourceMappingURL=commandRunner.d.ts.map