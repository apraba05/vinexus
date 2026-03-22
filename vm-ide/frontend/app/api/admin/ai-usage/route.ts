import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/adminGuard";

// Cost per request in cents (matches aiService.ts estimates)
const COST_PER_REQ: Record<string, number> = {
  "claude-haiku-4-5-20251001": 0.11,
  "claude-sonnet-4-6":         0.78,
  "claude-opus-4-6":           3.90,
};

export async function GET(req: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get("days") ?? "30", 10), 90);

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().slice(0, 10);

  // ── Per-user daily totals ─────────────────────────────────────────
  const rows = await prisma.aiUsage.findMany({
    where: { date: { gte: sinceDate } },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { date: "desc" },
  });

  // Aggregate by user
  const byUser = new Map<string, {
    userId: string; email: string; name: string | null;
    totalRequests: number; estimatedCostCents: number;
    byModel: Record<string, number>;
  }>();

  let grandTotal = 0;
  let grandCostCents = 0;

  for (const row of rows) {
    const uid = row.userId;
    if (!byUser.has(uid)) {
      byUser.set(uid, {
        userId: uid,
        email: row.user.email,
        name: row.user.name,
        totalRequests: 0,
        estimatedCostCents: 0,
        byModel: {},
      });
    }
    const entry = byUser.get(uid)!;
    entry.totalRequests += row.count;
    const costCents = row.count * (COST_PER_REQ[row.model] ?? 0);
    entry.estimatedCostCents += costCents;
    entry.byModel[row.model] = (entry.byModel[row.model] ?? 0) + row.count;
    grandTotal += row.count;
    grandCostCents += costCents;
  }

  // ── Daily totals (for chart) ──────────────────────────────────────
  const byDay = new Map<string, { requests: number; costCents: number }>();
  for (const row of rows) {
    const d = row.date;
    if (!byDay.has(d)) byDay.set(d, { requests: 0, costCents: 0 });
    const entry = byDay.get(d)!;
    entry.requests += row.count;
    entry.costCents += row.count * (COST_PER_REQ[row.model] ?? 0);
  }

  const topUsers = [...byUser.values()]
    .sort((a, b) => b.totalRequests - a.totalRequests)
    .slice(0, 50);

  const dailySeries = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  return NextResponse.json({
    period: { days, since: sinceDate },
    summary: {
      totalRequests: grandTotal,
      estimatedCostCents: Math.round(grandCostCents),
      estimatedCostDollars: +(grandCostCents / 100).toFixed(2),
    },
    topUsers,
    dailySeries,
  });
}
