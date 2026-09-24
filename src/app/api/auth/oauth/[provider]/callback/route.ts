import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchOAuthProfile, isProviderConfigured, type OAuthProvider } from "@/lib/oauth";
import { signSession, signOAuthDraft, COOKIE_NAME } from "@/lib/auth";

const STATE_COOKIE = "oauth_state";

function loginErrorRedirect(origin: string, code: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("oauthError", code);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const origin = req.nextUrl.origin;
  if (provider !== "google" && provider !== "facebook") {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }
  const p = provider as OAuthProvider;
  if (!isProviderConfigured(p)) return loginErrorRedirect(origin, "not_configured");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get(STATE_COOKIE)?.value;

  if (req.nextUrl.searchParams.get("error")) {
    // The person cancelled on the provider's consent screen — not a real error.
    return NextResponse.redirect(new URL("/login", origin));
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return loginErrorRedirect(origin, "invalid_state");
  }

  let profile;
  try {
    const redirectUri = new URL(`/api/auth/oauth/${p}/callback`, origin).toString();
    profile = await fetchOAuthProfile(p, code, redirectUri);
  } catch (e: unknown) {
    const reason = e instanceof Error ? e.message : "oauth_failed";
    return loginErrorRedirect(origin, reason);
  }

  // Same identity model as normal registration: the contact (here, the
  // verified social email) doubles as the student's "roll".
  const [existing] = await db.select().from(students).where(eq(students.roll, profile.email));

  if (existing) {
    if (!existing.approved) {
      return loginErrorRedirect(origin, "pending_approval");
    }
    const token = signSession({ role: "student", id: existing.id, name: existing.name });
    // Signed in — land on the home page (same as normal email/password login).
    const res = NextResponse.redirect(new URL("/", origin));
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    res.cookies.delete(STATE_COOKIE);
    return res;
  }

  // No account yet — we know who they are, but still need their batch. Carry
  // the verified profile to /oauth-complete in a short-lived signed token
  // rather than trusting anything the client could resubmit unverified.
  const draft = signOAuthDraft({ provider: p, email: profile.email, name: profile.name, picture: profile.picture });
  const url = new URL("/oauth-complete", origin);
  url.searchParams.set("draft", draft);
  const res = NextResponse.redirect(url);
  res.cookies.delete(STATE_COOKIE);
  return res;
}
