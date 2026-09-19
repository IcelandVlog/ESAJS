import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";

// Checks the code only — doesn't touch the password. Lets the UI move the
// student to the "set new password" step only after the OTP is confirmed correct.
export async function POST(req: NextRequest) {
  const { roll, batch, code } = (await req.json()) as { roll?: string; batch?: string; code?: string };
  if (!roll || !batch || !code) {
    return NextResponse.json({ error: "কোড দিন" }, { status: 400 });
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

  return NextResponse.json({ ok: true });
}
