import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getSubscriptionPeriod(sub: any): { start: Date | null; end: Date | null } {
  const startTs = sub.current_period_start;
  const endTs = sub.current_period_end;
  return {
    start: startTs ? new Date(typeof startTs === "number" ? startTs * 1000 : startTs) : null,
    end: endTs ? new Date(typeof endTs === "number" ? endTs * 1000 : endTs) : null,
  };
}

async function resolvePlanForSubscription(subscription: any, explicitPlanKey?: string | null) {
  const byName = explicitPlanKey
    ? await prisma.plan.findUnique({ where: { name: explicitPlanKey } }).catch(() => null)
    : null;
  if (byName) return byName;

  const stripePriceId = subscription?.items?.data?.[0]?.price?.id;
  if (stripePriceId) {
    const byPrice = await prisma.plan.findUnique({ where: { stripePriceId } }).catch(() => null);
    if (byPrice) return byPrice;
  }

  return await prisma.plan.findUnique({ where: { name: "free" } }).catch(() => null);
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
  });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (!userId || !session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const plan = await resolvePlanForSubscription(subscription, session.metadata?.planKey);
        if (!plan) break;

        const period = getSubscriptionPeriod(subscription);

        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: subscription.id },
          update: {
            planId: plan.id,
            status: subscription.status,
            stripePriceId: subscription.items.data[0]?.price.id,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          },
          create: {
            userId,
            planId: plan.id,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0]?.price.id,
            status: subscription.status,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: plan.name,
            ...(session.customer ? { stripeCustomerId: session.customer as string } : {}),
          },
        }).catch(() => {});
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
          include: { user: true },
        });
        if (!existing) break;

        const period = getSubscriptionPeriod(subscription);
        const plan = await resolvePlanForSubscription(subscription, existing.planId ? null : undefined);

        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            ...(plan ? { planId: plan.id } : {}),
            status: subscription.status,
            stripePriceId: subscription.items.data[0]?.price.id,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });

        if (plan) {
          const stillEntitled =
            ["active", "trialing", "past_due"].includes(subscription.status) ||
            (subscription.status === "canceled" && !!period.end && period.end > new Date());

          await prisma.user.update({
            where: { id: existing.userId },
            data: { plan: stillEntitled ? plan.name : "free" },
          }).catch(() => {});
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
          include: { user: true },
        });
        if (!existing) break;

        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: "canceled",
            canceledAt: new Date(),
          },
        });

        await prisma.user.update({
          where: { id: existing.userId },
          data: { plan: "free" },
        }).catch(() => {});
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subId = (invoice as any).subscription as string;
        if (!subId) break;

        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subId },
        });
        if (!existing) break;

        await prisma.subscription.update({
          where: { stripeSubscriptionId: subId },
          data: { status: "past_due" },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
