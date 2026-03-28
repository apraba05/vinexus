import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

const ENTITLED_STATUSES = ["active", "trialing", "past_due"] as const;

function isPaidPlan(planName: string | null | undefined): boolean {
  return typeof planName === "string" && planName.trim() !== "" && planName !== "free";
}

/**
 * Middleware that checks if the authenticated user has an active paid subscription.
 * Must be used AFTER requireUser middleware.
 * Returns 402 Payment Required if the user is on the Free plan.
 */
export async function requirePro(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = (req as any).user;

  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        OR: [
          { status: { in: [...ENTITLED_STATUSES] } },
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
    });

    if (isPaidPlan(subscription?.plan?.name)) {
      (req as any).subscription = subscription;
      return next();
    }

    // Fall back to the synced user plan so desktop auth and backend gating agree
    // even if the subscription row is temporarily stale or still migrating.
    if (isPaidPlan(user.plan)) {
      return next();
    }

    res.status(402).json({
      error: "Paid subscription required",
      upgradeUrl: `${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/pricing`,
    });
  } catch (error) {
    console.error("[requirePro] Error:", error);
    res.status(500).json({ error: "Subscription check failed" });
  }
}
