import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "changeme123!";

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
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM || null,
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
    stripePriceId: process.env.STRIPE_PRICE_MAX || null,
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
    stripePriceId: process.env.STRIPE_PRICE_AI_PRO || null,
    price: 9900,
    interval: "month",
    features: {
      maxVmConnections: -1,
      aiEnabled: true,
      aiModel: "claude-opus-4-6",
      aiRequestsPerDay: 50,
      deployAutomation: true,
      prioritySupport: true,
      agentDev: true,
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
      agentDev: true,
    },
  },
];

async function main() {
  console.log("Seeding plans...");
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {
        displayName: plan.displayName,
        price: plan.price,
        interval: plan.interval,
        features: plan.features,
        ...(plan.stripePriceId ? { stripePriceId: plan.stripePriceId } : {}),
      },
      create: plan,
    });
    console.log(`  ✓ ${plan.displayName}`);
  }

  if (!ADMIN_EMAIL) {
    console.log("No SEED_ADMIN_EMAIL set, skipping admin user.");
    console.log("Done.");
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "owner", plan: "ai-pro", passwordHash },
    create: {
      email: ADMIN_EMAIL,
      name: "Admin",
      role: "owner",
      plan: "ai-pro",
      passwordHash,
    },
  });

  const aiProPlan = await prisma.plan.findUnique({ where: { name: "ai-pro" } });
  if (aiProPlan) {
    const existing = await prisma.subscription.findFirst({
      where: { userId: admin.id },
      orderBy: { createdAt: "desc" },
    });
    const entitlementDates = {
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          planId: aiProPlan.id,
          status: "active",
          ...entitlementDates,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: admin.id,
          planId: aiProPlan.id,
          status: "active",
          ...entitlementDates,
        },
      });
    }
  }

  console.log(`  ✓ Admin: ${admin.email}`);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
