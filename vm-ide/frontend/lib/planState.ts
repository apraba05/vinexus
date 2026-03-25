import { prisma } from "./prisma";

export const DEFAULT_FEATURES = {
  ide: true,
  terminal: true,
  files: true,
  deploy: false,
  commands: false,
  ai: false,
};

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

  let planKey = "free";
  try {
    const planUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true } as any,
    });
    planKey = (planUser as any)?.plan ?? "free";
  } catch {
    // Older local databases may not have the plan column yet.
  }

  const planRecord = await prisma.plan.findUnique({ where: { name: planKey } }).catch(() => null);

  return {
    user: baseUser,
    planKey,
    features: (planRecord?.features as any) ?? DEFAULT_FEATURES,
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
    features: planState.features,
  };
}
