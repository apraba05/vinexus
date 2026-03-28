import { prisma } from "../lib/prisma";

// Monthly token limits per plan. -1 = unlimited.
export const PLAN_TOKEN_LIMITS: Record<string, number> = {
  free:       500_000,
  premium:  3_000_000,
  max:      8_000_000,
  "ai-pro": 20_000_000,
  enterprise: -1,
};

// Daily request limits per plan. -1 = unlimited.
export const PLAN_DAILY_REQUEST_LIMITS: Record<string, number> = {
  free:       20,
  premium:    -1,
  max:        -1,
  "ai-pro":   -1,
  enterprise: -1,
};

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function todayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Return total tokens consumed by the user in the current calendar month.
 */
export async function getMonthlyTokenUsage(userId: string): Promise<number> {
  const month = currentMonth();
  const rows = await prisma.aiUsage.findMany({
    where: { userId, date: { startsWith: month } },
    select: { count: true },
  });
  return rows.reduce((sum, r) => sum + r.count, 0);
}

/**
 * Throw if the user has exhausted their monthly token quota.
 */
export async function checkTokenQuota(userId: string, planName: string): Promise<void> {
  const plan = planName?.toLowerCase() ?? "free";
  const limit = PLAN_TOKEN_LIMITS[plan] ?? 0;

  // -1 = unlimited (enterprise)
  if (limit === -1) return;

  if (limit === 0) {
    throw new Error("AI features require a subscription.");
  }

  const used = await getMonthlyTokenUsage(userId);
  if (used >= limit) {
    const limitLabel = limit >= 1_000_000
      ? `${(limit / 1_000_000).toFixed(0)}M`
      : `${(limit / 1_000).toFixed(0)}K`;
    throw new Error(
      `Monthly AI token limit reached (${limitLabel} tokens). Your limit resets at the start of next month.`
    );
  }
}

/**
 * Return today's AI request count for the user.
 */
export async function getDailyRequestUsage(userId: string): Promise<number> {
  const date = todayDate();
  const row = await prisma.dailyAiRequests.findUnique({
    where: { userId_date: { userId, date } },
    select: { count: true },
  });
  return row?.count ?? 0;
}

/**
 * Throw if the user has hit their daily request quota (free tier only).
 */
export async function checkDailyRequestQuota(userId: string, planName: string): Promise<void> {
  const plan = planName?.toLowerCase() ?? "free";
  const limit = PLAN_DAILY_REQUEST_LIMITS[plan] ?? -1;

  if (limit === -1) return; // unlimited

  const used = await getDailyRequestUsage(userId);
  if (used >= limit) {
    throw new Error(
      `Daily AI request limit reached (${limit} requests/day). Your limit resets at midnight UTC.`
    );
  }
}

/**
 * Increment today's request count for the user. Fire-and-forget safe.
 */
export async function recordDailyRequest(userId: string): Promise<void> {
  if (!userId) return;
  const date = todayDate();
  try {
    await prisma.dailyAiRequests.upsert({
      where: { userId_date: { userId, date } },
      update: { count: { increment: 1 } },
      create: { userId, date, count: 1 },
    });
  } catch (err: any) {
    console.error("[tokenQuota] Failed to record daily request:", err.message);
  }
}

/**
 * Add token usage to the current month's tally for this user + model.
 * Uses first day of month as date key so all monthly usage rolls into one row.
 * Fire-and-forget safe: errors are logged but never rethrown.
 */
export async function recordTokenUsage(
  userId: string,
  model: string,
  tokens: number
): Promise<void> {
  if (!userId || tokens <= 0) return;
  const date = `${currentMonth()}-01`;
  try {
    await prisma.aiUsage.upsert({
      where: { userId_date_model: { userId, date, model } },
      update: { count: { increment: tokens } },
      create: { userId, date, model, count: tokens },
    });
  } catch (err: any) {
    console.error("[tokenQuota] Failed to record usage:", err.message);
  }
}
