import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sub = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["active", "trialing"] },
        stripeSubscriptionId: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!sub?.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    if (sub.cancelAtPeriodEnd) {
      return NextResponse.json({ error: "Subscription is already set to cancel" }, { status: 409 });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
    });

    const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true },
    });

    const updatedAny = updated as any;
    const periodEnd = updatedAny.current_period_end
      ? new Date(updatedAny.current_period_end * 1000).toISOString()
      : null;

    return NextResponse.json({ canceled: true, accessUntil: periodEnd });
  } catch (error) {
    console.error("Cancel error:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
