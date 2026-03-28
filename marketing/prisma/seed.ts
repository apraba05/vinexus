import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "apraba05@gmail.com";

function firstDefined(...values: Array<string | undefined>): string | null {
  return values.find((value) => typeof value === "string" && value.length > 0) ?? null;
}

async function main() {
  // Ensure Plan rows exist (needed by FK constraints and desktop plan lookup)
  const plans = [
    {
      name: "free",
      displayName: "Free",
      stripePriceId: null,
      price: 0,
      interval: null,
      features: {
        maxVmConnections: 1,
        aiEnabled: false,
        aiModel: null,
        aiRequestsPerDay: 0,
        deployAutomation: false,
        prioritySupport: false,
      },
    },
    {
      name: "premium",
      displayName: "Premium",
      stripePriceId: firstDefined(
        process.env.STRIPE_PRICE_PREMIUM,
        process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
        process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID
      ),
      price: 1900,
      interval: "month",
      features: {
        maxVmConnections: 3,
        aiEnabled: true,
        aiModel: "claude-haiku-4-5-20251001",
        aiRequestsPerDay: 50,
        deployAutomation: true,
        prioritySupport: false,
      },
    },
    {
      name: "max",
      displayName: "Max",
      stripePriceId: firstDefined(
        process.env.STRIPE_PRICE_MAX,
        process.env.STRIPE_PRICE_MAX_MONTHLY,
        process.env.STRIPE_MAX_MONTHLY_PRICE_ID
      ),
      price: 4900,
      interval: "month",
      features: {
        maxVmConnections: -1,
        aiEnabled: true,
        aiModel: "claude-sonnet-4-6",
        aiRequestsPerDay: 500,
        deployAutomation: true,
        prioritySupport: true,
      },
    },
    {
      name: "ai-pro",
      displayName: "AI Pro",
      stripePriceId: firstDefined(
        process.env.STRIPE_PRICE_AI_PRO,
        process.env.STRIPE_PRICE_AI_PRO_MONTHLY,
        process.env.STRIPE_AIPRO_MONTHLY_PRICE_ID
      ),
      price: 9900,
      interval: "month",
      features: {
        maxVmConnections: -1,
        aiEnabled: true,
        aiModel: "claude-opus-4-6",
        aiRequestsPerDay: 50,
        deployAutomation: true,
        prioritySupport: true,
      },
    },
    {
      name: "enterprise",
      displayName: "Enterprise",
      stripePriceId: null,
      price: 0,
      interval: null,
      features: {
        maxVmConnections: -1,
        aiEnabled: true,
        aiModel: "claude-opus-4-6",
        aiRequestsPerDay: -1,
        deployAutomation: true,
        prioritySupport: true,
      },
    },
  ];

  console.log("Seeding plans...");
  for (const plan of plans) {
    await (prisma as any).plan.upsert({
      where: { name: plan.name },
      update: {
        displayName: plan.displayName,
        price: plan.price,
        interval: plan.interval,
        features: plan.features,
      },
      create: plan,
    });
    console.log(`  ✓ ${plan.displayName}`);
  }

  // Set admin plan to ai-pro
  console.log(`Setting admin plan for ${ADMIN_EMAIL}...`);
  const updated = await (prisma as any).user.updateMany({
    where: { email: ADMIN_EMAIL },
    data: { plan: "ai-pro", role: "admin" },
  });
  if (updated.count > 0) {
    console.log(`  ✓ Admin plan set to ai-pro`);
  } else {
    console.log(`  ℹ Admin user not found — will be set on first login`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
