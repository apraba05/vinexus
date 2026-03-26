/**
 * POST /api/auth/desktop-token
 *
 * Called by /desktop-callback after the user logs in on the web.
 * Generates a short-lived one-time token that the Electron app exchanges
 * for a full user session via /api/auth/desktop-exchange.
 */
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  const session = await getSession(request as unknown as Request);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const hashedToken = hashToken(rawToken);
    const identifier = `desktop-auth:${session.userId}`;
    const expires = new Date(Date.now() + TOKEN_TTL_MS);

    // Remove any existing pending token for this user
    await prisma.verificationToken.deleteMany({ where: { identifier } }).catch(() => null);

    await prisma.verificationToken.create({
      data: { identifier, token: hashedToken, expires },
    });

    return NextResponse.json({ token: rawToken, expiresAt: expires.toISOString() });
  } catch (err) {
    console.error("desktop-token error:", err);
    return NextResponse.json({ error: "Server error generating desktop token" }, { status: 500 });
  }
}
