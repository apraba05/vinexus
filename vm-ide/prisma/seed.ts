import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Free plan
  await prisma.plan.upsert({
    where: { name: "free" },
    update: {},
    create: {
      name: "free",
      displayName: "Free",
      price: 0,
      features: {
        ide: true,
        terminal: true,
        files: true,
        deploy: true,
        commands: false,
        ai: false,
      },
    },
  });

  // Pro plan
  await prisma.plan.upsert({
    where: { name: "pro" },
    update: {},
    create: {
      name: "pro",
      displayName: "Pro",
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null,
      price: 1900,
      interval: "month",
      features: {
        ide: true,
        terminal: true,
        files: true,
        deploy: true,
        commands: true,
        ai: true,
      },
    },
  });

  console.log("Seeded Free and Pro plans");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
