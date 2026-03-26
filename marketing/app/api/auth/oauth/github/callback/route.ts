/**
 * GET /api/auth/oauth/github/callback
 * Handles the GitHub OAuth callback. Exchanges the code for a token,
 * fetches the user profile, upserts User + Account, sets the session cookie,
 * then redirects to /desktop-callback (desktop flow) or / (web flow).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
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
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${origin}/api/auth/oauth/github/callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
      console.error("GitHub token exchange failed:", tokenData);
      return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
    }

    const accessToken: string = tokenData.access_token;

    // Fetch user profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "vinexus" },
    });
    const ghUser: GitHubUser = await userRes.json();

    // Fetch verified primary email if not in profile
    let email = ghUser.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "vinexus" },
      });
      const emails: GitHubEmail[] = await emailsRes.json();
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email ?? null;
    }

    if (!email) {
      return NextResponse.redirect(`${origin}/login?error=no_email`);
    }

    const providerAccountId = String(ghUser.id);

    // Upsert user and account
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: ghUser.name ?? ghUser.login,
          image: ghUser.avatar_url,
          emailVerified: new Date(),
        },
      });
    }

    await prisma.account.upsert({
      where: { provider_providerAccountId: { provider: "github", providerAccountId } },
      update: { access_token: accessToken },
      create: {
        userId: user.id,
        type: "oauth",
        provider: "github",
        providerAccountId,
        access_token: accessToken,
      },
    });

    const response = NextResponse.redirect(`${origin}${next}`);
    await setSessionCookie(response, { userId: user.id, email: user.email, name: user.name ?? "" });
    return response;
  } catch (err) {
    console.error("GitHub OAuth callback error:", err);
    return NextResponse.redirect(`${origin}/login?error=server_error`);
  }
}
