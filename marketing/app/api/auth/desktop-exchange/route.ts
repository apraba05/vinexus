/**
 * POST /api/auth/desktop-exchange
 *
 * Called by the Electron main process to exchange a one-time desktop token
 * (issued by /api/auth/desktop-token) for a full user + plan object.
 * Token is single-use and expires after 5 minutes.
 */
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_FEATURES = {
  ide: true,
  terminal: true,
  files: true,
  deploy: false,
  commands: false,
  ai: false,
};

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

  try {
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

    // Consume the token (one-time use)
    await prisma.verificationToken.delete({ where: { token: hashedToken } }).catch(() => null);

    const userId = storedToken.identifier.slice("desktop-auth:".length);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Resolve plan key
    let planKey = "free";
    try {
      const planUser = await (prisma.user.findUnique as any)({
        where: { id: userId },
        select: { plan: true },
      });
      planKey = planUser?.plan ?? "free";
    } catch {
      // plan column may not exist on older DB schema
    }

    // Resolve plan features
    const planRecord = await prisma.plan.findUnique({ where: { name: planKey } }).catch(() => null);
    const features = (planRecord?.features as typeof DEFAULT_FEATURES) ?? DEFAULT_FEATURES;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? user.email,
        image: user.image ?? null,
        plan: planKey,
        features,
      },
    });
  } catch (err) {
    console.error("desktop-exchange error:", err);
    return NextResponse.json({ error: "Server error during token exchange" }, { status: 500 });
  }
}
