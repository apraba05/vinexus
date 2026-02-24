import { NextRequest, NextResponse } from "next/server";
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

  if (currentUser?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId } = body;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Find Pro plan
  const proPlan = await prisma.plan.findUnique({ where: { name: "pro" } });
  if (!proPlan) {
    return NextResponse.json({ error: "Pro plan not found" }, { status: 500 });
  }

  // Check for existing active subscription
  const existing = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["active", "trialing"] },
    },
  });

  if (existing) {
    // Update to Pro if not already
    await prisma.subscription.update({
      where: { id: existing.id },
      data: { planId: proPlan.id, status: "active" },
    });
  } else {
    // Create new subscription
    await prisma.subscription.create({
      data: {
        userId,
        planId: proPlan.id,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });
  }

  return NextResponse.json({ ok: true });
}
