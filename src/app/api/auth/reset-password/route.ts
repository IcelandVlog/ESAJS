import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { roll, batch, code, newPassword } = (await req.json()) as {
    roll?: string;
    batch?: string;
    code?: string;
    newPassword?: string;
  };

  if (!roll || !batch || !code || !newPassword) {
    return NextResponse.json({ error: "সব ফিল্ড পূরণ করুন" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে" }, { status: 400 });
  }

  const [student] = await db.select().from(students).where(eq(students.roll, roll.trim()));
  if (!student || (student.batch || "") !== batch.trim()) {
    return NextResponse.json({ error: "রোল বা ব্যাচ মিলছে না" }, { status: 400 });
  }

  if (!student.resetCode || !student.resetCodeExpires) {
    return NextResponse.json({ error: "আগে একটি কোড রিকোয়েস্ট করুন" }, { status: 400 });
  }
  if (new Date(student.resetCodeExpires).getTime() < Date.now()) {
    return NextResponse.json({ error: "কোডের মেয়াদ শেষ হয়ে গেছে, আবার রিকোয়েস্ট করুন" }, { status: 400 });
  }
  if (student.resetCode !== code.trim()) {
    return NextResponse.json({ error: "ভুল কোড" }, { status: 400 });
  }

  const hashed = await hashPassword(newPassword);
  await db
    .update(students)
    .set({ password: hashed, resetCode: null, resetCodeExpires: null })
    .where(eq(students.id, student.id));

  return NextResponse.json({ ok: true });
}
