/**
 * /api/auth/desktop-login
 *
 * Endpoint for the Electron desktop app to authenticate users directly.
 * Bypasses NextAuth browser flow (which requires CSRF tokens).
 * Rate-limited by the Express backend; not exposed via external proxy.
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_FEATURES = {
  ide: true, terminal: true, files: true,
  deploy: false, commands: false, ai: false,
};

export async function POST(req: NextRequest) {
  let email: string, password: string;
  try {
    const body = await req.json();
    email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Read plan directly from user record
  const planName = (user as any).plan ?? "free";
  const planRecord = await prisma.plan.findUnique({ where: { name: planName } });
  const plan = planName;
  const features = planRecord ? (planRecord.features as any) : (planName === "free" ? DEFAULT_FEATURES : { ide: true, terminal: true, files: true, deploy: true, commands: true, ai: true });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? user.email,
      plan,
      features,
    },
  });
}
