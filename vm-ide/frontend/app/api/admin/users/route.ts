import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (currentUser?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
      subscriptions: {
        where: { status: { in: ["active", "trialing"] } },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = users.map((u: any) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    image: u.image,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    plan: u.subscriptions[0]?.plan?.name || "free",
    subscriptionStatus: u.subscriptions[0]?.status || null,
  }));

  return NextResponse.json({ users: result });
}
