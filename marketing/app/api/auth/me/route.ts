import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ user: null });
    }

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

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name ?? "", plan: planName },
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ user: null });
  }
}
