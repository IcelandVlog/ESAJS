import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { buildAuthorizeUrl, isProviderConfigured, type OAuthProvider } from "@/lib/oauth";

const STATE_COOKIE = "oauth_state";

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (provider !== "google" && provider !== "facebook") {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }
  const p = provider as OAuthProvider;

  if (!isProviderConfigured(p)) {
    // Not set up yet — send the person back to login with a clear reason
    // instead of a bare 500, since this is expected until the admin adds
    // the Client ID/Secret env vars.
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("oauthError", "not_configured");
    return NextResponse.redirect(url);
  }

  const redirectUri = new URL(`/api/auth/oauth/${p}/callback`, req.nextUrl.origin).toString();
  const state = randomBytes(16).toString("hex");
  const authorizeUrl = buildAuthorizeUrl(p, redirectUri, state);

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes is plenty for the round trip
  });
  return res;
}
