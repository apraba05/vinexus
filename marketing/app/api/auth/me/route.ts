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

    const planName: string = (user as any).plan ?? "free";

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name ?? "", plan: planName },
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ user: null });
  }
}
