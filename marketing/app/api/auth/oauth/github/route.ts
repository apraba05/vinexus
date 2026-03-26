/**
 * GET /api/auth/oauth/github
 * Redirects the browser to GitHub's OAuth authorization page.
 * Accepts ?desktop=1 to encode desktop flow in the state parameter.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const desktop = searchParams.get("desktop") === "1";

  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 500 });
  }

  const state = Buffer.from(JSON.stringify({ desktop })).toString("base64url");
  const redirectUri = `${origin}/api/auth/oauth/github/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "user:email",
    state,
  });

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
}
