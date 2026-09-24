import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me-in-production";
export const COOKIE_NAME = "school_session";

export type SessionPayload = {
  // "admin" = main admin, "batch_admin" = limited to one batch, "student".
  // Existing routes that check role === "admin" therefore stay main-admin-only.
  role: "admin" | "batch_admin" | "student";
  id: number;
  name: string;
};

/** True for accounts that live in the `admins` table (main admin + batch admins). */
export function isStaffRole(role: SessionPayload["role"]): boolean {
  return role === "admin" || role === "batch_admin";
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

// Short-lived token for the OAuth "just need your batch" step: a Google/Facebook
// sign-in verifies who the person is, but we still need their batch before we can
// create a students row, so this carries the verified profile across that one
// extra page without touching the database yet.
export type OAuthDraftPayload = {
  provider: "google" | "facebook";
  email: string;
  name: string;
  picture: string | null;
};

export function signOAuthDraft(payload: OAuthDraftPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function verifyOAuthDraft(token: string): OAuthDraftPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as OAuthDraftPayload;
  } catch {
    return null;
  }
}
