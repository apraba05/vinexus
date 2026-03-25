import { AIExplanation, AIAnalysis } from "../types";
export declare class AIService {
    private client;
    private modelId;
    constructor();
    /**
     * Explain a config/code file — returns structured analysis.
     */
    explainFile(filePath: string, content: string): Promise<AIExplanation>;
    /**
     * Diagnose a service failure from logs + optional config.
     */
    diagnoseFailure(serviceName: string, logs: string, configContent?: string): Promise<AIAnalysis>;
    /**
     * AI-assisted validation explanation — explain why a validation failed.
     */
    explainValidationError(filePath: string, validationOutput: string, fileContent: string): Promise<{
        explanation: string;
        suggestions: string[];
    }>;
    private chat;
    private sanitize;
    private parseJSON;
}
export declare const aiService: AIService;
//# sourceMappingURL=aiService.d.ts.map