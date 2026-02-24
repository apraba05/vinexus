import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
const MIN_PASSWORD_LENGTH = 8;

function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, 500);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = sanitizeString(body.email).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const name = sanitizeString(body.name);

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Validate password
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: "Password is too long" },
        { status: 400 }
      );
    }

    // Validate name
    if (name && name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: "Name is too long" },
        { status: 400 }
      );
    }

    // Check for existing user (case-insensitive)
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
      },
    });

    // Send verification email
    try {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.verificationToken.create({
        data: { identifier: email, token, expires },
      });

      await sendVerificationEmail(email, token);
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr);
    }

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
