import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { verifyOAuthDraft, hashPassword, signSession, COOKIE_NAME } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { draft, batch, dob } = (await req.json()) as { draft?: string; batch?: string; dob?: string };
  if (!draft || !batch) {
    return NextResponse.json({ error: "ব্যাচ বাছাই করুন" }, { status: 400 });
  }

  const dobTrimmed = dob?.trim() || "";
  if (dobTrimmed && (!/^\d{4}-\d{2}-\d{2}$/.test(dobTrimmed) || Number.isNaN(new Date(dobTrimmed).getTime()))) {
    return NextResponse.json({ error: "সঠিক জন্ম তারিখ দিন" }, { status: 400 });
  }

  const payload = verifyOAuthDraft(draft);
  if (!payload) {
    return NextResponse.json({ error: "সময় শেষ হয়ে গেছে, আবার Google/Facebook দিয়ে চেষ্টা করুন" }, { status: 400 });
  }

  try {
    // Social sign-ins never use a password, but the column is required —
    // this random value is never shown to anyone and never usable to log in
    // with, since the login form only checks it against a typed password.
    const unusablePassword = await hashPassword(randomBytes(24).toString("hex"));

    const inserted = await db
      .insert(students)
      .values({
        roll: payload.email,
        name: payload.name,
        className: "",
        section: "",
        batch,
        phone: "",
        dateOfBirth: dobTrimmed || null,
        password: unusablePassword,
        photoUrl: payload.picture,
        // Google already verified this person's identity/email, so unlike
        // plain email+password sign-ups, they don't need to wait for an
        // admin to manually approve the account before logging in.
        approved: true,
      })
      .returning();

    const student = inserted[0];
    const token = signSession({ role: "student", id: student.id, name: student.name });
    const res = NextResponse.json({ ok: true, name: student.name });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "23505") {
      return NextResponse.json({ error: "এই ইমেইল দিয়ে ইতিমধ্যে রেজিস্ট্রেশন করা হয়েছে" }, { status: 409 });
    }
    return NextResponse.json({ error: "সমস্যা হয়েছে, আবার চেষ্টা করুন" }, { status: 500 });
  }
}
