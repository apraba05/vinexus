/**
 * /api/auth/desktop-plan
 *
 * Endpoint used by the Electron desktop app to fetch a user's current plan.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_FEATURES = {
  ide: true, terminal: true, files: true,
  deploy: false, commands: false, ai: false,
};

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const body = await req.json();
    email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  // Admin always gets ai-pro
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (adminEmail && email === adminEmail) {
    return NextResponse.json({
      planKey: "ai-pro",
      planName: "AI Pro",
      features: { ide: true, terminal: true, files: true, deploy: true, commands: true, ai: true },
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ planKey: "free", planName: "Free", features: DEFAULT_FEATURES });
  }

  const sub = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      status: { in: ["active", "trialing"] },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    planKey:  sub?.plan.name        ?? "free",
    planName: sub?.plan.displayName ?? "Free",
    features: sub?.plan.features    ?? DEFAULT_FEATURES,
  });
}
