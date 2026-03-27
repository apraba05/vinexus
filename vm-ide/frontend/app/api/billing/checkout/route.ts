import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Maps planKey + billing to the env var that holds the Stripe price ID.
// Env var names match what is configured in Vercel (STRIPE_PRICE_<PLAN>_<PERIOD>).
function getPriceId(planKey: string, billing: string): string | undefined {
  const annual = billing === "annual";
  const map: Record<string, string | undefined> = {
    premium: annual
      ? process.env.STRIPE_PRICE_PREMIUM_ANNUAL
      : process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    max: annual
      ? process.env.STRIPE_PRICE_MAX_ANNUAL
      : process.env.STRIPE_PRICE_MAX_MONTHLY,
    "ai-pro": annual
      ? process.env.STRIPE_PRICE_AI_PRO_ANNUAL
      : process.env.STRIPE_PRICE_AI_PRO_MONTHLY,
  };
  return map[planKey];
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
    });

    // Create or reuse Stripe customer
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
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?upgrade=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?upgrade=cancel`,
      metadata: { userId: user.id, planKey, billing },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
