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

  const user = await prisma.user.findUnique({
    where: { email },
    select: { plan: true } as any,
  });

  if (!user) {
    return NextResponse.json({ planKey: "free", planName: "Free", features: DEFAULT_FEATURES });
  }

  const planKey = (user as any).plan ?? "free";
  const planRecord = await prisma.plan.findUnique({ where: { name: planKey } });

  return NextResponse.json({
    planKey,
    planName: planRecord?.displayName ?? planKey,
    features: planRecord?.features ?? DEFAULT_FEATURES,
  });
}
