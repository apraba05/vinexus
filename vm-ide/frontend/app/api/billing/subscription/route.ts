import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sub = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["active", "trialing", "past_due", "canceled"] },
      },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });

    if (!sub) {
      return NextResponse.json({
        planKey:         "free",
        planName:        "Free",
        status:          "free",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
      });
    }

    return NextResponse.json({
      planKey:          sub.plan.name,
      planName:         sub.plan.displayName,
      status:           sub.status,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}
