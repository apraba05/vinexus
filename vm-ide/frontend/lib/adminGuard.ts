/**
 * adminGuard.ts
 *
 * Two-tier admin access control:
 *
 *  requireOwner()  — owner only (role === "admin" AND email === ADMIN_EMAIL).
 *                    Full access: revenue, create/delete users, change roles.
 *
 *  requireStaff()  — owner OR staff (role === "staff").
 *                    Limited read-only access: users list, AI usage stats.
 *
 * Fails CLOSED — if ADMIN_EMAIL is not set, no one passes requireOwner().
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export function isOwnerEmail(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return email.toLowerCase().trim() === adminEmail.toLowerCase().trim();
}

type GuardOk   = { ok: true;  userId: string; email: string; role: string };
type GuardFail = { ok: false; response: NextResponse };

/** Type-safe helper — call when guard.ok is false to retrieve the response. */
export function guardFailResponse(guard: GuardOk | GuardFail): NextResponse {
  return (guard as GuardFail).response;
}

async function resolveUser(): Promise<
  { user: { id: string; email: string; role: string } } | { response: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });
  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}

/** Full owner access — role === "admin" AND email matches ADMIN_EMAIL env var. */
export async function requireOwner(): Promise<GuardOk | GuardFail> {
  const result = await resolveUser();
  if ("response" in result) return { ok: false, response: result.response };
  const { user } = result;

  if (user.role !== "owner" || !isOwnerEmail(user.email)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId: user.id, email: user.email, role: user.role };
}

/** Staff-level access — owner OR users with role === "staff". */
export async function requireStaff(): Promise<GuardOk | GuardFail> {
  const result = await resolveUser();
  if ("response" in result) return { ok: false, response: result.response };
  const { user } = result;

  const isOwner = user.role === "owner" && isOwnerEmail(user.email);
  const isStaff = user.role === "staff";

  if (!isOwner && !isStaff) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId: user.id, email: user.email, role: user.role };
}
