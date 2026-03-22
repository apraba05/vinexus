/**
 * /api/auth/desktop-plan
 *
 * Localhost-only endpoint used by the Electron desktop app to fetch
 * a user's current plan from the database after they log in locally.
 *
 * Security: only reachable from 127.0.0.1 (the embedded Next.js server);
 * blocked for any request that arrives via an external proxy.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_FEATURES = {
  ide: true, terminal: true, files: true,
  deploy: false, commands: false, ai: false,
};

function isLocalhost(req: NextRequest): boolean {
  // Reject if the request came through an external proxy
  if (req.headers.get("x-forwarded-for")) return false;
  const host = req.headers.get("host") ?? "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export async function POST(req: NextRequest) {
  if (!isLocalhost(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let email: string;
  try {
    const body = await req.json();
    email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    // Unknown user — return free plan so the app can still open
    return NextResponse.json({ planKey: "free", planName: "Free", features: DEFAULT_FEATURES });
  }

  const sub = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      status: { in: ["active", "trialing"] },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    planKey:  sub?.plan.name     ?? "free",
    planName: sub?.plan.displayName ?? "Free",
    features: sub?.plan.features ?? DEFAULT_FEATURES,
  });
}
