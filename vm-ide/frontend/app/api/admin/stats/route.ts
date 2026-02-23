import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (currentUser?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [activeSubscriptions, canceledSubscriptions, activeSubs, recentActivity] =
    await Promise.all([
      prisma.subscription.count({
        where: { status: { in: ["active", "trialing"] } },
      }),
      prisma.subscription.count({
        where: { status: "canceled" },
      }),
      prisma.subscription.findMany({
        where: { status: { in: ["active", "trialing"] } },
        include: { plan: true },
      }),
      prisma.subscription.findMany({
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          user: { select: { id: true, email: true, name: true } },
          plan: { select: { name: true, displayName: true, price: true } },
        },
      }),
    ]);

  const mrr = activeSubs.reduce((sum, sub) => sum + (sub.plan?.price ?? 0), 0);
  const totalRevenue = mrr; // Approximation based on current active subs

  return NextResponse.json({
    activeSubscriptions,
    canceledSubscriptions,
    mrr,
    totalRevenue,
    recentActivity: recentActivity.map((sub) => ({
      id: sub.id,
      userName: sub.user.name || sub.user.email,
      userEmail: sub.user.email,
      planName: sub.plan.displayName || sub.plan.name,
      status: sub.status,
      updatedAt: sub.updatedAt.toISOString(),
    })),
  });
}
