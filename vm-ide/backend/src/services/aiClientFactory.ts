export type AIProvider = "anthropic" | "together";

export interface AIClientConfig {
  provider: AIProvider;
  modelId: string;
  apiKey: string;
  baseURL?: string;
}

const TOGETHER_BASE_URL = "https://api.together.xyz/v1";

const PLAN_CONFIGS: Record<string, AIClientConfig> = {
  free: {
    provider: "together",
    modelId: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    apiKey: process.env.TOGETHER_AI_API_KEY ?? "",
    baseURL: TOGETHER_BASE_URL,
  },
  premium: {
    provider: "anthropic",
    modelId: "claude-haiku-4-5-20251001",
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  },
  max: {
    provider: "anthropic",
    modelId: "claude-sonnet-4-6",
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  },
  "ai-pro": {
    provider: "anthropic",
    modelId: "claude-sonnet-4-6",
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  },
  enterprise: {
    provider: "anthropic",
    modelId: "claude-opus-4-6",
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  },
};

export function getAIClientConfig(planName: string): AIClientConfig {
  const plan = planName?.toLowerCase() ?? "free";
  return PLAN_CONFIGS[plan] ?? PLAN_CONFIGS.free;
}
