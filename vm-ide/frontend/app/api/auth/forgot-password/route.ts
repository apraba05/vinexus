import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ message: "Check your email for a reset link." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Delete existing tokens for this email
      await prisma.passwordResetToken.deleteMany({ where: { email: normalizedEmail } });

      await prisma.passwordResetToken.create({
        data: { email: normalizedEmail, token, expires },
      });

      await sendPasswordResetEmail(normalizedEmail, token);
    }

    return NextResponse.json({ message: "Check your email for a reset link." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Check your email for a reset link." });
  }
}
