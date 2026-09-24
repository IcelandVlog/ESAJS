import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { hashPassword, signSession, COOKIE_NAME } from "@/lib/auth";
import {
  PASSWORD_RULE,
  EMAIL_RULE,
  MOBILE_RULE,
  BLOOD_GROUPS,
  NON_STUDENT_BATCH,
  isValidBatch,
  isValidDob,
} from "@/lib/validation";

// People who pick a real batch year (i.e. say they are alumni of this school) are
// approved right away and logged in automatically. People who pick "other"
// (not a student of this school) stay pending until an admin approves them.
// Set this to false to send EVERY new registration to the admin's pending list again.
const AUTO_APPROVE_SCHOOL_STUDENTS = true;

async function verifyRecaptcha(token: string | undefined): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  // If no secret key is configured, skip verification (e.g. local/dev setup without reCAPTCHA yet).
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, batch, email, mobile, dob, password, bloodGroup, recaptchaToken } = body as {
    name?: string;
    batch?: string;
    email?: string;
    mobile?: string;
    dob?: string;
    password?: string;
    bloodGroup?: string;
    recaptchaToken?: string;
  };

  if (!name || !batch || !email || !password) {
    return NextResponse.json({ error: "সব ফিল্ড পূরণ করুন" }, { status: 400 });
  }

  if (!isValidBatch(batch)) {
    return NextResponse.json({ error: "সঠিক ব্যাচ নির্বাচন করুন" }, { status: 400 });
  }

  if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup)) {
    return NextResponse.json({ error: "সঠিক ব্লাড গ্রুপ বাছাই করুন" }, { status: 400 });
  }

  if (!EMAIL_RULE.test(email.trim())) {
    return NextResponse.json({ error: "সঠিক ইমেইল দিন" }, { status: 400 });
  }

  const mobileTrimmed = mobile?.trim() || "";
  if (mobileTrimmed && !MOBILE_RULE.test(mobileTrimmed)) {
    return NextResponse.json({ error: "সঠিক মোবাইল নম্বর দিন" }, { status: 400 });
  }

  const dobTrimmed = dob?.trim() || "";
  if (dobTrimmed && !isValidDob(dobTrimmed)) {
    return NextResponse.json({ error: "সঠিক জন্ম তারিখ দিন" }, { status: 400 });
  }

  if (!PASSWORD_RULE.test(password)) {
    return NextResponse.json(
      { error: "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে, একটি বড় হাতের অক্ষর, একটি সংখ্যা ও একটি বিশেষ চিহ্ন থাকতে হবে" },
      { status: 400 }
    );
  }

  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) {
    return NextResponse.json({ error: "reCAPTCHA যাচাই ব্যর্থ হয়েছে, আবার চেষ্টা করুন" }, { status: 400 });
  }

  const approved = AUTO_APPROVE_SCHOOL_STUDENTS && batch !== NON_STUDENT_BATCH;

  try {
    const inserted = await db
      .insert(students)
      .values({
        roll: email.trim(),
        name: name.trim(),
        className: "",
        section: "",
        batch,
        phone: mobileTrimmed,
        dateOfBirth: dobTrimmed || null,
        bloodGroup: bloodGroup || null,
        password: await hashPassword(password),
        approved,
      })
      .returning();

    const student = inserted[0];

    if (!approved) {
      // Non-student: no session yet — they can log in once an admin approves them.
      return NextResponse.json({ ok: true, pending: true, name: student.name }, { status: 201 });
    }

    // School student: log them in straight away so they land on the home page signed in.
    const token = signSession({ role: "student", id: student.id, name: student.name });
    const res = NextResponse.json({ ok: true, pending: false, name: student.name }, { status: 201 });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e: any) {
    if (e?.code === "23505") {
      return NextResponse.json({ error: "এই ইমেইল দিয়ে ইতিমধ্যে রেজিস্ট্রেশন করা হয়েছে" }, { status: 409 });
    }
    // Log the real reason (visible in terminal / Vercel logs) instead of hiding it.
    console.error("REGISTER ERROR:", e?.code, e?.message, e?.cause?.message ?? "");
    return NextResponse.json({ error: "সমস্যা হয়েছে, আবার চেষ্টা করুন" }, { status: 500 });
  }
}
