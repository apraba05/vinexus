import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vinexus.space";

function firstDefined(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => typeof value === "string" && value.length > 0);
}

function getPriceId(planKey: string, billing: string): string | undefined {
  const annual = billing === "annual";
  const map: Record<string, string | undefined> = {
    premium: annual
      ? firstDefined(
          process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
          process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID
        )
      : firstDefined(
          process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
          process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID
        ),
    max: annual
      ? firstDefined(
          process.env.STRIPE_PRICE_MAX_ANNUAL,
          process.env.STRIPE_MAX_ANNUAL_PRICE_ID
        )
      : firstDefined(
          process.env.STRIPE_PRICE_MAX_MONTHLY,
          process.env.STRIPE_MAX_MONTHLY_PRICE_ID
        ),
    "ai-pro": annual
      ? firstDefined(
          process.env.STRIPE_PRICE_AI_PRO_ANNUAL,
          process.env.STRIPE_AIPRO_ANNUAL_PRICE_ID
        )
      : firstDefined(
          process.env.STRIPE_PRICE_AI_PRO_MONTHLY,
          process.env.STRIPE_AIPRO_MONTHLY_PRICE_ID
        ),
  };
  return map[planKey];
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const planKey: string = body.planKey ?? "premium";
    const billing: string = body.billing ?? "monthly";

    const priceId = getPriceId(planKey, billing);
    if (!priceId) {
      return NextResponse.json(
        { error: `No price configured for plan "${planKey}" (${billing}). Please contact support.` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const Stripe = (await import("stripe")).default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-01-28.clover" as any });

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_URL}/account?upgrade=success`,
      cancel_url: `${SITE_URL}/pricing?upgrade=cancel`,
      metadata: { userId: user.id, planKey, billing },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
