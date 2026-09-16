import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

// Password rule: at least 6 characters, one uppercase letter, one number, one special character.
const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,}$/;
// Very loose phone-or-email check — just enough to reject obvious junk.
const CONTACT_RULE = /^(\+?\d{10,15}|[^\s@]+@[^\s@]+\.[^\s@]+)$/;
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

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
  const { name, batch, contact, password, bloodGroup, recaptchaToken } = body as {
    name?: string;
    batch?: string;
    contact?: string;
    password?: string;
    bloodGroup?: string;
    recaptchaToken?: string;
  };

  if (!name || !batch || !contact || !password) {
    return NextResponse.json({ error: "সব ফিল্ড পূরণ করুন" }, { status: 400 });
  }

  if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup)) {
    return NextResponse.json({ error: "সঠিক ব্লাড গ্রুপ বাছাই করুন" }, { status: 400 });
  }

  if (!CONTACT_RULE.test(contact.trim())) {
    return NextResponse.json({ error: "সঠিক মোবাইল নম্বর বা ইমেইল দিন" }, { status: 400 });
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

  try {
    const inserted = await db
      .insert(students)
      .values({
        roll: contact.trim(),
        name: name.trim(),
        className: "",
        section: "",
        batch,
        phone: contact.trim(),
        bloodGroup: bloodGroup || null,
        password: await hashPassword(password),
        approved: false,
      })
      .returning();

    const student = inserted[0];
    return NextResponse.json(
      { ok: true, pending: true, name: student.name },
      { status: 201 }
    );
  } catch (e: any) {
    if (e?.code === "23505") {
      return NextResponse.json({ error: "এই মোবাইল/ইমেইল দিয়ে ইতিমধ্যে রেজিস্ট্রেশন করা হয়েছে" }, { status: 409 });
    }
    return NextResponse.json({ error: "সমস্যা হয়েছে, আবার চেষ্টা করুন" }, { status: 500 });
  }
}
