import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { admins, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, signSession, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { role, identifier, password, batch } = body as {
    role: "admin" | "student";
    identifier: string; // username for admin, roll/mobile/email for student
    password: string;
    batch?: string;
  };

  if (!role || !identifier || !password) {
    return NextResponse.json({ error: "সব ফিল্ড পূরণ করুন" }, { status: 400 });
  }

  if (role === "admin") {
    const [admin] = await db.select().from(admins).where(eq(admins.username, identifier));
    if (!admin || !(await verifyPassword(password, admin.password))) {
      return NextResponse.json({ error: "ভুল ইউজারনেম বা পাসওয়ার্ড" }, { status: 401 });
    }
    // A batch admin has a batch set; the main admin does not.
    const token = signSession({ role: admin.batch ? "batch_admin" : "admin", id: admin.id, name: admin.name });
    const res = NextResponse.json({ ok: true, role: "admin", name: admin.name });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  }

  if (role === "student") {
    if (!batch) {
      return NextResponse.json({ error: "ব্যাচ নির্বাচন করুন" }, { status: 400 });
    }
    const [student] = await db.select().from(students).where(eq(students.roll, identifier));
    if (!student || !(await verifyPassword(password, student.password))) {
      return NextResponse.json({ error: "ভুল তথ্য বা পাসওয়ার্ড" }, { status: 401 });
    }
    if ((student.batch || "") !== batch) {
      return NextResponse.json({ error: "ভুল ব্যাচ নির্বাচন করা হয়েছে" }, { status: 401 });
    }
    if (!student.approved) {
      return NextResponse.json(
        { error: "আপনার অ্যাকাউন্ট এখনো অ্যাডমিন কর্তৃক অনুমোদিত হয়নি। অনুগ্রহ করে অপেক্ষা করুন।" },
        { status: 403 }
      );
    }
    const token = signSession({ role: "student", id: student.id, name: student.name });
    const res = NextResponse.json({ ok: true, role: "student", name: student.name });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  }

  return NextResponse.json({ error: "Invalid role" }, { status: 400 });
}
