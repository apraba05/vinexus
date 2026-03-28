import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!["admin","owner"].includes(currentUser?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId } = body;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const body2 = body as { userId: string; plan?: string };
  const planName = body2.plan ?? "ai-pro";

  const plan = await prisma.plan.findUnique({
    where: { name: planName },
  });

  if (!plan) {
    return NextResponse.json({ error: `Unknown plan: ${planName}` }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { plan: planName } as any,
  });

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existingSubscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: [
      { currentPeriodEnd: "desc" },
      { createdAt: "desc" },
    ],
  });

  const entitlementDates = {
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  };

  if (existingSubscription) {
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        planId: plan.id,
        status: "active",
        canceledAt: null,
        cancelAtPeriodEnd: false,
        ...entitlementDates,
      },
    });
  } else {
    await prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: "active",
        cancelAtPeriodEnd: false,
        ...entitlementDates,
      },
    });
  }

  return NextResponse.json({ ok: true, plan: planName });
}
