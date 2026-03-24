import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Admin always gets ai-pro
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const isAdmin = !!(adminEmail && user.email.toLowerCase().trim() === adminEmail);

    let planName: string;
    if (isAdmin) {
      planName = "ai-pro";
    } else {
      const subscription = await prisma.subscription.findFirst({
        where: { userId: user.id, status: { in: ["active", "trialing"] } },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      });
      planName = subscription?.plan?.name ?? "free";
    }

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name ?? "", plan: planName },
    });
    await setSessionCookie(response, {
      userId: user.id,
      email: user.email,
      name: user.name ?? "",
    });
    return response;
  } catch (error) {
    console.error("Login error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("AUTH_SECRET")) {
      return NextResponse.json({ error: "Server misconfiguration: AUTH_SECRET not set" }, { status: 500 });
    }
    if (msg.includes("DATABASE_URL") || msg.includes("prisma") || msg.includes("connect")) {
      return NextResponse.json({ error: "Database connection error — check DATABASE_URL env var" }, { status: 500 });
    }
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
