import { prisma } from "../lib/prisma";

// Monthly token limits per plan — all Sonnet ($3/M input, $15/M output)
// Worst case (all output at $15/M) is still profitable at each price point:
//   Premium  ($19/mo): 1M tokens → $15 cost → $4 profit
//   Max      ($49/mo): 3M tokens → $45 cost → $4 profit
//   AI Pro   ($99/mo): 6M tokens → $90 cost → $9 profit
export const PLAN_TOKEN_LIMITS: Record<string, number> = {
  premium:  1_000_000,
  max:      3_000_000,
  "ai-pro": 6_000_000,
  free:     0,
};

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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

  if (limit === 0) {
    throw new Error("AI features require a paid subscription.");
  }

  const used = await getMonthlyTokenUsage(userId);
  if (used >= limit) {
    const limitM = (limit / 1_000_000).toFixed(0);
    throw new Error(
      `Monthly AI token limit reached (${limitM}M tokens). Your limit resets at the start of next month.`
    );
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
