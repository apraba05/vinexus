import { prisma } from "./prisma";
import { PLAN_FEATURES, type Plan } from "./plans";

export const DEFAULT_FEATURES = {
  ide: true,
  terminal: true,
  files: true,
  deploy: false,
  commands: false,
  ai: false,
  agentDev: false,
};

function normalizePlanKey(planKey: string): Plan | null {
  if (planKey === "free" || planKey === "premium" || planKey === "max" || planKey === "ai-pro" || planKey === "enterprise") {
    return planKey;
  }

  if (planKey === "pro") {
    return "ai-pro";
  }

  return null;
}

function getFallbackDesktopFeatures(planKey: string) {
  const normalizedPlanKey = normalizePlanKey(planKey);
  const planFeatures = normalizedPlanKey ? PLAN_FEATURES[normalizedPlanKey] : null;
  const paidPlan = normalizedPlanKey !== null && normalizedPlanKey !== "free";

  if (!planFeatures) {
    return {
      ...DEFAULT_FEATURES,
    };
  }

  return {
    ...DEFAULT_FEATURES,
    ide: true,
    terminal: true,
    files: true,
    deploy: Boolean(planFeatures.deployAutomation),
    commands: paidPlan,
    ai: Boolean(planFeatures.aiEnabled),
    agentDev: normalizedPlanKey === "ai-pro" || normalizedPlanKey === "enterprise",
  };
}

function normalizeDesktopFeatures(rawFeatures: any, planKey: string) {
  if (!rawFeatures || typeof rawFeatures !== "object") {
    return getFallbackDesktopFeatures(planKey);
  }

  const normalized = getFallbackDesktopFeatures(planKey);

  // Legacy desktop feature shape
  if (
    "ide" in rawFeatures ||
    "terminal" in rawFeatures ||
    "files" in rawFeatures ||
    "deploy" in rawFeatures ||
    "commands" in rawFeatures ||
    "ai" in rawFeatures ||
    "agentDev" in rawFeatures
  ) {
    return {
      ...normalized,
      ...rawFeatures,
    };
  }

  // Newer billing plan shape used by pricing/Stripe flows
  const paidPlan = planKey !== "free";
  const normalizedPlanKey = normalizePlanKey(planKey);
  return {
    ...normalized,
    ide: true,
    terminal: true,
    files: true,
    deploy: Boolean(rawFeatures.deployAutomation),
    commands: paidPlan,
    ai: Boolean(rawFeatures.aiEnabled),
    agentDev:
      Boolean(rawFeatures.agentDev) ||
      normalizedPlanKey === "ai-pro" ||
      normalizedPlanKey === "enterprise",
  };
}

async function getEffectivePlanForUser(userId: string, fallbackPlanKey: string) {
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      OR: [
        { status: { in: ["active", "trialing", "past_due"] } },
        {
          status: "canceled",
          currentPeriodEnd: { gt: new Date() },
        },
      ],
    },
    orderBy: [
      { currentPeriodEnd: "desc" },
      { createdAt: "desc" },
    ],
    include: { plan: true },
  }).catch(() => null);

  if (activeSubscription?.plan) {
    return {
      planKey: activeSubscription.plan.name,
      features: normalizeDesktopFeatures(activeSubscription.plan.features, activeSubscription.plan.name),
    };
  }

  const planRecord = await prisma.plan.findUnique({ where: { name: fallbackPlanKey } }).catch(() => null);
  return {
    planKey: fallbackPlanKey,
    features: normalizeDesktopFeatures(planRecord?.features, fallbackPlanKey),
  };
}

export async function getUserPlanState(userId: string) {
  const baseUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      emailVerified: true,
      name: true,
      image: true,
    },
  });

  if (!baseUser) {
    return {
      user: null,
      planKey: "free",
      features: DEFAULT_FEATURES,
    };
  }

  let storedPlanKey = "free";
  try {
    const planUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true } as any,
    });
    storedPlanKey = (planUser as any)?.plan ?? "free";
  } catch {
    // Older local databases may not have the plan column yet.
  }

  const effectivePlan = await getEffectivePlanForUser(userId, storedPlanKey);

  return {
    user: baseUser,
    planKey: effectivePlan.planKey,
    features: effectivePlan.features,
  };
}

export async function getPlanStateByEmail(email: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!existingUser) {
    return {
      userId: null,
      planKey: "free",
      planName: "Free",
      features: DEFAULT_FEATURES,
    };
  }

  const planState = await getUserPlanState(existingUser.id);
  const planRecord = await prisma.plan.findUnique({ where: { name: planState.planKey } }).catch(() => null);

  return {
    userId: existingUser.id,
    planKey: planState.planKey,
    planName: planRecord?.displayName ?? planState.planKey,
    features: normalizeDesktopFeatures((planRecord?.features as any) ?? planState.features, planState.planKey),
  };
}
