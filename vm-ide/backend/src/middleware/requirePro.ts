import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

/**
 * Middleware that checks if the authenticated user has an active Pro subscription.
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
        status: { in: ["active", "trialing"] },
      },
      include: { plan: true },
    });

    if (subscription && subscription.plan.name === "pro") {
      (req as any).subscription = subscription;
      return next();
    }

    res.status(402).json({
      error: "Pro subscription required",
      upgradeUrl: `${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/pricing`,
    });
  } catch (error) {
    console.error("[requirePro] Error:", error);
    res.status(500).json({ error: "Subscription check failed" });
  }
}
