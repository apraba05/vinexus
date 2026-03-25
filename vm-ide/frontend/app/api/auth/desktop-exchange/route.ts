import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPlanState } from "@/lib/planState";

export const dynamic = "force-dynamic";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  let token = "";
  try {
    const body = await req.json();
    token = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const hashedToken = hashToken(token);
  const storedToken = await prisma.verificationToken.findUnique({
    where: { token: hashedToken },
  });

  if (!storedToken || !storedToken.identifier.startsWith("desktop-auth:")) {
    return NextResponse.json({ error: "Invalid desktop auth token" }, { status: 401 });
  }

  if (storedToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: hashedToken } }).catch(() => null);
    return NextResponse.json({ error: "Desktop auth token expired" }, { status: 401 });
  }

  await prisma.verificationToken.delete({ where: { token: hashedToken } }).catch(() => null);

  const userId = storedToken.identifier.slice("desktop-auth:".length);
  const planState = await getUserPlanState(userId);
  const user = planState.user;

  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? user.email,
      image: user.image ?? null,
      plan: planState.planKey,
      features: planState.features,
    },
  });
}
