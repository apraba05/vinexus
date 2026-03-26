import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireOwner, isOwnerEmail, guardFailResponse } from "@/lib/adminGuard";

const ALLOWED_ROLES = ["user", "staff"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const guard = await requireOwner();
  if (!guard.ok) return guardFailResponse(guard);

  const { userId } = params;
  const body = await req.json();
  const newRole: string = typeof body.role === "string" ? body.role.toLowerCase() : "";

  if (!ALLOWED_ROLES.includes(newRole)) {
    return NextResponse.json(
      { error: `Role must be one of: ${ALLOWED_ROLES.join(", ")}` },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent demoting the owner account
  if (isOwnerEmail(target.email)) {
    return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 403 });
  }

  await prisma.user.update({ where: { id: userId }, data: { role: newRole } });
  return NextResponse.json({ ok: true, userId, role: newRole });
}
