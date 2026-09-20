// Minimal, dependency-free OAuth2 "Authorization Code" flow for Google and
// Facebook. No next-auth — this hooks straight into the app's existing
// JWT-cookie session (see lib/auth.ts) so social sign-in and password
// sign-in end up as the exact same kind of session.

export type OAuthProvider = "google" | "facebook";

export type OAuthProfile = {
  email: string;
  name: string;
  picture: string | null;
};

export function isProviderConfigured(provider: OAuthProvider): boolean {
  if (provider === "google") {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }
  return !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);
}

export function buildAuthorizeUrl(provider: OAuthProvider, redirectUri: string, state: string): string {
  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "email,public_profile",
    state,
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}

// Exchanges the ?code=... from the callback for the user's profile.
// Throws on any failure — callers should catch and show a friendly error.
export async function fetchOAuthProfile(
  provider: OAuthProvider,
  code: string,
  redirectUri: string
): Promise<OAuthProfile> {
  if (provider === "google") {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) throw new Error("google_token_exchange_failed");

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.email) throw new Error("google_profile_fetch_failed");

    return { email: profile.email, name: profile.name || profile.email, picture: profile.picture || null };
  }

  // Facebook exchanges the code via a GET request (not POST like Google).
  const tokenParams = new URLSearchParams({
    client_id: process.env.FACEBOOK_CLIENT_ID!,
    client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
    code,
    redirect_uri: redirectUri,
  });
  const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams.toString()}`);
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) throw new Error("facebook_token_exchange_failed");

  const profileParams = new URLSearchParams({
    fields: "id,name,email,picture.type(large)",
    access_token: tokenData.access_token,
  });
  const profileRes = await fetch(`https://graph.facebook.com/me?${profileParams.toString()}`);
  const profile = await profileRes.json();
  if (!profileRes.ok || !profile.email) {
    // Facebook accounts can legitimately have no email (e.g. phone-only signup) —
    // we can't create/match a student without one, so surface that distinctly.
    throw new Error(!profile.email ? "facebook_no_email" : "facebook_profile_fetch_failed");
  }

  return { email: profile.email, name: profile.name || profile.email, picture: profile.picture?.data?.url || null };
}
