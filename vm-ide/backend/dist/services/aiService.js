"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
// Secrets pattern to strip before sending to AI
const SECRET_PATTERNS = [
    /(?:KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL|API_KEY|ACCESS_KEY|PRIVATE)[=:\s]+\S+/gi,
    /-----BEGIN[\s\S]*?-----END[^\n]+/g, // PEM keys
    /(?:[A-Za-z0-9+/]{40,})={0,2}/g, // long base64 strings (likely keys)
];
const MAX_CONTENT_CHARS = 12_000; // ~3K tokens budget for file content
class AIService {
    client;
    modelId;
    constructor() {
        this.client = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
        this.modelId =
            process.env.ANTHROPIC_MODEL_ID || "claude-haiku-4-5-20251001";
    }
    /**
     * Explain a config/code file — returns structured analysis.
     */
    async explainFile(filePath, content) {
        const sanitized = this.sanitize(content);
        const response = await this.chat(`You are a senior DevOps/SRE engineer. Analyze the following file and provide a JSON response.

File: ${filePath}

\`\`\`
${sanitized}
\`\`\`

Respond with ONLY valid JSON in this exact format:
{
  "summary": "1-2 sentence summary of what this file does",
  "risks": ["list of security/reliability risks"],
  "misconfigurations": ["list of misconfigurations or errors"],
  "optimizations": ["list of optimization suggestions"],
  "lineNotes": [{"line": 1, "note": "explanation for this line"}]
}

Keep lineNotes to the 5 most important lines. If everything looks good, return empty arrays for risks/misconfigurations.`);
        return this.parseJSON(response, {
            summary: "Unable to analyze file",
            risks: [],
            misconfigurations: [],
            optimizations: [],
            lineNotes: [],
        });
    }
    /**
     * Diagnose a service failure from logs + optional config.
     */
    async diagnoseFailure(serviceName, logs, configContent) {
        const sanitizedLogs = this.sanitize(logs).slice(0, 6000);
        const sanitizedConfig = configContent
            ? this.sanitize(configContent).slice(0, 4000)
            : "";
        let prompt = `You are a senior DevOps/SRE engineer diagnosing a service failure.

Service: ${serviceName}

Recent logs:
\`\`\`
${sanitizedLogs}
\`\`\``;
        if (sanitizedConfig) {
            prompt += `\n\nRelated configuration:\n\`\`\`\n${sanitizedConfig}\n\`\`\``;
        }
        prompt += `\n\nRespond with ONLY valid JSON in this exact format:
{
  "rootCause": "concise root cause explanation",
  "explanation": "detailed explanation of what went wrong and why",
  "suggestedFixes": ["step 1 to fix", "step 2 to fix"],
  "severity": "low|medium|high|critical"
}`;
        const response = await this.chat(prompt);
        return this.parseJSON(response, {
            rootCause: "Unable to determine root cause",
            explanation: "Analysis unavailable",
            suggestedFixes: [],
            severity: "medium",
        });
    }
    /**
     * AI-assisted validation explanation — explain why a validation failed.
     */
    async explainValidationError(filePath, validationOutput, fileContent) {
        const sanitized = this.sanitize(fileContent).slice(0, 6000);
        const response = await this.chat(`You are a senior DevOps engineer. A validation check failed for a file.

File: ${filePath}

Validation output:
\`\`\`
${validationOutput}
\`\`\`

File content:
\`\`\`
${sanitized}
\`\`\`

Respond with ONLY valid JSON:
{
  "explanation": "plain-english explanation of what's wrong",
  "suggestions": ["specific fix 1", "specific fix 2"]
}`);
        return this.parseJSON(response, {
            explanation: "Unable to analyze validation error",
            suggestions: [],
        });
    }
    // ─── Internal ──────────────────────────────────────────────────
    async chat(userMessage) {
        const response = await this.client.messages.create({
            model: this.modelId,
            max_tokens: 2048,
            temperature: 0.2,
            system: "You are an expert DevOps and systems engineer. Always respond with valid JSON only, no markdown fences, no extra text.",
            messages: [{ role: "user", content: userMessage }],
        });
        const textBlock = response.content.find((b) => b.type === "text");
        if (!textBlock || textBlock.type !== "text") {
            throw new Error("No text in AI response");
        }
        return textBlock.text;
    }
    sanitize(content) {
        let sanitized = content.slice(0, MAX_CONTENT_CHARS);
        for (const pattern of SECRET_PATTERNS) {
            sanitized = sanitized.replace(pattern, "[REDACTED]");
        }
        return sanitized;
    }
    parseJSON(text, fallback) {
        try {
            // Strip markdown fences if present despite instructions
            const cleaned = text
                .replace(/^```json?\n?/m, "")
                .replace(/\n?```$/m, "")
                .trim();
            return JSON.parse(cleaned);
        }
        catch {
            console.warn("[ai] Failed to parse AI response as JSON:", text.slice(0, 200));
            return fallback;
        }
    }
}
exports.AIService = AIService;
exports.aiService = new AIService();
//# sourceMappingURL=aiService.js.map