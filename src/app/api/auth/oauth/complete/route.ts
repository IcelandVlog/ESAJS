import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { verifyOAuthDraft, hashPassword } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { draft, batch } = (await req.json()) as { draft?: string; batch?: string };
  if (!draft || !batch) {
    return NextResponse.json({ error: "ব্যাচ বাছাই করুন" }, { status: 400 });
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
        phone: payload.email,
        password: unusablePassword,
        photoUrl: payload.picture,
        approved: false,
      })
      .returning();

    return NextResponse.json({ ok: true, name: inserted[0].name });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "23505") {
      return NextResponse.json({ error: "এই ইমেইল দিয়ে ইতিমধ্যে রেজিস্ট্রেশন করা হয়েছে" }, { status: 409 });
    }
    return NextResponse.json({ error: "সমস্যা হয়েছে, আবার চেষ্টা করুন" }, { status: 500 });
  }
}
