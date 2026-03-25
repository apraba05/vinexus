import crypto from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TOKEN_TTL_MS = 5 * 60 * 1000;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const hashedToken = hashToken(rawToken);
  const identifier = `desktop-auth:${session.user.id}`;
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: {
      identifier,
    },
  }).catch(() => null);

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashedToken,
      expires,
    },
  });

  return NextResponse.json({
    token: rawToken,
    expiresAt: expires.toISOString(),
  });
}
