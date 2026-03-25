/**
 * /api/auth/desktop-plan
 *
 * Endpoint used by the Electron desktop app to fetch a user's current plan.
 */
import { NextRequest, NextResponse } from "next/server";
import { getPlanStateByEmail } from "@/lib/planState";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

  const { planKey, planName, features } = await getPlanStateByEmail(email);

  return NextResponse.json({
    planKey,
    planName,
    features,
  });
}
