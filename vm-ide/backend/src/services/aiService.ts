import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
  type ContentBlock,
} from "@aws-sdk/client-bedrock-runtime";
import { AIExplanation, AIAnalysis } from "../types";

// Secrets pattern to strip before sending to AI
const SECRET_PATTERNS = [
  /(?:KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL|API_KEY|ACCESS_KEY|PRIVATE)[=:\s]+\S+/gi,
  /-----BEGIN[\s\S]*?-----END[^\n]+/g, // PEM keys
  /(?:[A-Za-z0-9+/]{40,})={0,2}/g, // long base64 strings (likely keys)
];

const MAX_CONTENT_CHARS = 12_000; // ~3K tokens budget for file content

export class AIService {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    this.modelId =
      process.env.BEDROCK_MODEL_ID || "anthropic.claude-sonnet-4-20250514-v1:0";
  }

  /**
   * Explain a config/code file — returns structured analysis.
   */
  async explainFile(
    filePath: string,
    content: string
  ): Promise<AIExplanation> {
    const sanitized = this.sanitize(content);

    const response = await this.chat([
      {
        role: "user",
        content: [
          {
            text: `You are a senior DevOps/SRE engineer. Analyze the following file and provide a JSON response.

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

Keep lineNotes to the 5 most important lines. If everything looks good, return empty arrays for risks/misconfigurations.`,
          },
        ],
      },
    ]);

    return this.parseJSON<AIExplanation>(response, {
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
    configContent?: string
  ): Promise<AIAnalysis> {
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

    const response = await this.chat([
      { role: "user", content: [{ text: prompt }] },
    ]);

    return this.parseJSON<AIAnalysis>(response, {
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
    fileContent: string
  ): Promise<{ explanation: string; suggestions: string[] }> {
    const sanitized = this.sanitize(fileContent).slice(0, 6000);

    const response = await this.chat([
      {
        role: "user",
        content: [
          {
            text: `You are a senior DevOps engineer. A validation check failed for a file.

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
}`,
          },
        ],
      },
    ]);

    return this.parseJSON(response, {
      explanation: "Unable to analyze validation error",
      suggestions: [],
    });
  }

  // ─── Internal ──────────────────────────────────────────────────

  private async chat(messages: Message[]): Promise<string> {
    const command = new ConverseCommand({
      modelId: this.modelId,
      messages,
      system: [
        {
          text: "You are an expert DevOps and systems engineer. Always respond with valid JSON only, no markdown fences, no extra text.",
        },
      ],
      inferenceConfig: {
        maxTokens: 2048,
        temperature: 0.2,
      },
    });

    const response = await this.client.send(command);

    const outputContent = response.output?.message?.content;
    if (!outputContent || outputContent.length === 0) {
      throw new Error("Empty response from Bedrock");
    }

    // Extract text from content blocks
    const textBlock = outputContent.find(
      (block: ContentBlock) => "text" in block
    );
    if (!textBlock || !("text" in textBlock)) {
      throw new Error("No text in Bedrock response");
    }

    return textBlock.text!;
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
