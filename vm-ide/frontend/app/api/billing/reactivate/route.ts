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
        stripeSubscriptionId: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!sub?.stripeSubscriptionId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
    });

    if (sub.status === "canceled") {
      // Subscription already expired — send them to a new checkout session
      // using the same plan they had before
      const plan = await prisma.plan.findUnique({ where: { id: sub.planId } });
      const priceId = sub.stripePriceId ?? plan?.stripePriceId;

      if (!priceId) {
        return NextResponse.json(
          { error: "Cannot reactivate: original plan price not found. Please choose a new plan." },
          { status: 422 }
        );
      }

      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!user?.stripeCustomerId) {
        return NextResponse.json({ error: "No billing account found" }, { status: 404 });
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: user.stripeCustomerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXTAUTH_URL}/app?upgrade=success`,
        cancel_url:  `${process.env.NEXTAUTH_URL}/account`,
        metadata: { userId: user.id },
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    // Subscription still active but scheduled to cancel — undo it
    if (!sub.cancelAtPeriodEnd) {
      return NextResponse.json({ error: "Subscription is not pending cancellation" }, { status: 409 });
    }

    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: false },
    });

    return NextResponse.json({ reactivated: true });
  } catch (error) {
    console.error("Reactivate error:", error);
    return NextResponse.json({ error: "Failed to reactivate subscription" }, { status: 500 });
  }
}
