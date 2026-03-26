/**
 * GET /api/auth/oauth/google/callback
 * Handles the Google OAuth callback. Exchanges the code for tokens,
 * fetches the user profile, upserts User + Account, sets the session cookie,
 * then redirects to /desktop-callback (desktop flow) or / (web flow).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  error?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_denied`);
  }

  let desktop = false;
  try {
    if (stateParam) {
      const parsed = JSON.parse(Buffer.from(stateParam, "base64url").toString());
      desktop = !!parsed.desktop;
    }
  } catch {
    // ignore malformed state
  }

  const next = desktop ? "/desktop-callback" : "/";

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${origin}/api/auth/oauth/google/callback`,
      }),
    });

    const tokenData: GoogleTokenResponse = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData);
      return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
    }

    // Fetch user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser: GoogleUserInfo = await userRes.json();

    if (!googleUser.email || !googleUser.email_verified) {
      return NextResponse.redirect(`${origin}/login?error=no_email`);
    }

    const providerAccountId = googleUser.sub;

    // Upsert user and account
    let user = await prisma.user.findUnique({ where: { email: googleUser.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          image: googleUser.picture,
          emailVerified: new Date(),
        },
      });
    }

    await prisma.account.upsert({
      where: { provider_providerAccountId: { provider: "google", providerAccountId } },
      update: { access_token: tokenData.access_token },
      create: {
        userId: user.id,
        type: "oauth",
        provider: "google",
        providerAccountId,
        access_token: tokenData.access_token,
      },
    });

    const response = NextResponse.redirect(`${origin}${next}`);
    await setSessionCookie(response, { userId: user.id, email: user.email, name: user.name ?? "" });
    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${origin}/login?error=server_error`);
  }
}
