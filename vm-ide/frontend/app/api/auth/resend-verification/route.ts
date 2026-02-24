import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete existing tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    });

    await prisma.verificationToken.create({
      data: { identifier: user.email, token, expires },
    });

    await sendVerificationEmail(user.email, token);

    return NextResponse.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
