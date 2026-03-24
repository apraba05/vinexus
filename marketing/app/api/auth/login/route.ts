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

    // Fetch active subscription
    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: { in: ["active", "trialing"] } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
    const planName = subscription?.plan?.name ?? "free";

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
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
