export type Plan = 'free' | 'premium' | 'max' | 'ai-pro' | 'enterprise';

export interface PlanFeatures {
  maxVmConnections: number;
  aiEnabled: boolean;
  aiModel: string | null;
  aiRequestsPerDay: number;
  monthlyTokenLimit: number; // -1 = unlimited
  deployAutomation: boolean;
  prioritySupport: boolean;
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free: {
    maxVmConnections: 1,
    aiEnabled: true,
    aiModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    aiRequestsPerDay: 20,
    monthlyTokenLimit: 500_000,
    deployAutomation: false,
    prioritySupport: false,
  },
  premium: {
    maxVmConnections: 3,
    aiEnabled: true,
    aiModel: 'claude-haiku-4-5-20251001',
    aiRequestsPerDay: -1, // unlimited
    monthlyTokenLimit: 3_000_000,
    deployAutomation: true,
    prioritySupport: false,
  },
  max: {
    maxVmConnections: -1, // unlimited
    aiEnabled: true,
    aiModel: 'claude-sonnet-4-6',
    aiRequestsPerDay: -1,
    monthlyTokenLimit: 8_000_000,
    deployAutomation: true,
    prioritySupport: true,
  },
  'ai-pro': {
    maxVmConnections: -1,
    aiEnabled: true,
    aiModel: 'claude-sonnet-4-6',
    aiRequestsPerDay: -1,
    monthlyTokenLimit: 20_000_000,
    deployAutomation: true,
    prioritySupport: true,
  },
  enterprise: {
    maxVmConnections: -1,
    aiEnabled: true,
    aiModel: 'claude-opus-4-6',
    aiRequestsPerDay: -1,
    monthlyTokenLimit: -1,
    deployAutomation: true,
    prioritySupport: true,
  },
};

export function canUsePlan(userPlan: Plan, feature: keyof PlanFeatures): boolean {
  return !!PLAN_FEATURES[userPlan][feature];
}

export const PLAN_PRICES: Record<Plan, string> = {
  free: '$0',
  premium: '$19',
  max: '$49',
  'ai-pro': '$99',
  enterprise: 'Contact',
};

export const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  premium: 'Premium',
  max: 'Max',
  'ai-pro': 'AI Pro',
  enterprise: 'Enterprise',
};
