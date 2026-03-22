import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Free plan — only IDE, terminal, files
  await prisma.plan.upsert({
    where: { name: "free" },
    update: {
      features: {
        ide: true,
        terminal: true,
        files: true,
        deploy: false,
        commands: false,
        ai: false,
      },
    },
    create: {
      name: "free",
      displayName: "Free",
      price: 0,
      features: {
        ide: true,
        terminal: true,
        files: true,
        deploy: false,
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

  // Admin account
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "";
  if (!adminEmail) { console.log("No SEED_ADMIN_EMAIL set, skipping admin user."); return; }
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "changeme123!";
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Ashan",
        passwordHash,
        role: "admin",
      },
    });

    // Give admin a Pro subscription
    const proPlan = await prisma.plan.findUnique({ where: { name: "pro" } });
    if (proPlan) {
      await prisma.subscription.create({
        data: {
          userId: admin.id,
          planId: proPlan.id,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log("Created admin account:", adminEmail);
  } else {
    // Ensure existing user is admin with Pro
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "admin" },
    });
    console.log("Admin account already exists, ensured admin role");
  }

  console.log("Seeded Free and Pro plans");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
