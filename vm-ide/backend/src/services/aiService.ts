import Anthropic from "@anthropic-ai/sdk";
import { AIExplanation, AIAnalysis } from "../types";
import { checkTokenQuota, recordTokenUsage } from "./tokenQuota";

// Secrets pattern to strip before sending to AI
const SECRET_PATTERNS = [
  /(?:KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL|API_KEY|ACCESS_KEY|PRIVATE)[=:\s]+\S+/gi,
  /-----BEGIN[\s\S]*?-----END[^\n]+/g, // PEM keys
  /(?:[A-Za-z0-9+/]{40,})={0,2}/g, // long base64 strings (likely keys)
];

const MAX_CONTENT_CHARS = 12_000; // ~3K tokens budget for file content

export class AIService {
  private client: Anthropic;
  private modelId: string;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.modelId =
      process.env.ANTHROPIC_MODEL_ID || "claude-sonnet-4-6";
  }

  /**
   * Explain a config/code file — returns structured analysis.
   */
  async explainFile(
    filePath: string,
    content: string,
    userId: string,
    planName: string
  ): Promise<AIExplanation> {
    await checkTokenQuota(userId, planName);
    const sanitized = this.sanitize(content);

    const { text, tokens } = await this.chat(
      `You are a senior DevOps/SRE engineer. Analyze the following file and provide a JSON response.

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

Keep lineNotes to the 5 most important lines. If everything looks good, return empty arrays for risks/misconfigurations.`
    );

    await recordTokenUsage(userId, this.modelId, tokens);

    return this.parseJSON<AIExplanation>(text, {
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
  async diagnoseFailure(
    serviceName: string,
    logs: string,
    configContent: string | undefined,
    userId: string,
    planName: string
  ): Promise<AIAnalysis> {
    await checkTokenQuota(userId, planName);
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

    const { text, tokens } = await this.chat(prompt);
    await recordTokenUsage(userId, this.modelId, tokens);

    return this.parseJSON<AIAnalysis>(text, {
      rootCause: "Unable to determine root cause",
      explanation: "Analysis unavailable",
      suggestedFixes: [],
      severity: "medium",
    });
  }

  /**
   * AI-assisted validation explanation — explain why a validation failed.
   */
  async explainValidationError(
    filePath: string,
    validationOutput: string,
    fileContent: string,
    userId: string,
    planName: string
  ): Promise<{ explanation: string; suggestions: string[] }> {
    await checkTokenQuota(userId, planName);
    const sanitized = this.sanitize(fileContent).slice(0, 6000);

    const { text, tokens } = await this.chat(
      `You are a senior DevOps engineer. A validation check failed for a file.

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
}`
    );

    await recordTokenUsage(userId, this.modelId, tokens);

    return this.parseJSON(text, {
      explanation: "Unable to analyze validation error",
      suggestions: [],
    });
  }

  // ─── Internal ──────────────────────────────────────────────────

  private async chat(userMessage: string): Promise<{ text: string; tokens: number }> {
    const response = await this.client.messages.create({
      model: this.modelId,
      max_tokens: 2048,
      temperature: 0.2,
      system:
        "You are an expert DevOps and systems engineer. Always respond with valid JSON only, no markdown fences, no extra text.",
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text in AI response");
    }

    const tokens = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
    return { text: textBlock.text, tokens };
  }

  private sanitize(content: string): string {
    let sanitized = content.slice(0, MAX_CONTENT_CHARS);
    for (const pattern of SECRET_PATTERNS) {
      sanitized = sanitized.replace(pattern, "[REDACTED]");
    }
    return sanitized;
  }

  private parseJSON<T>(text: string, fallback: T): T {
    try {
      // Strip markdown fences if present despite instructions
      const cleaned = text
        .replace(/^```json?\n?/m, "")
        .replace(/\n?```$/m, "")
        .trim();
      return JSON.parse(cleaned);
    } catch {
      console.warn("[ai] Failed to parse AI response as JSON:", text.slice(0, 200));
      return fallback;
    }
  }
}

export const aiService = new AIService();
