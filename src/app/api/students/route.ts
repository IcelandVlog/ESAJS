import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const all = await db.select().from(students).orderBy(desc(students.id));
  // never leak password hashes
  const safe = all.map(({ password, ...rest }) => rest);
  return NextResponse.json({ students: safe });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { roll, name, className, section, fatherName, motherName, phone, address, password } = body;
  if (!roll || !name || !className || !password) {
    return NextResponse.json({ error: "রোল, নাম, ক্লাস ও পাসওয়ার্ড আবশ্যক" }, { status: 400 });
  }
  try {
    const inserted = await db
      .insert(students)
      .values({
        roll: String(roll),
        name,
        className,
        section: section || "",
        fatherName: fatherName || "",
        motherName: motherName || "",
        phone: phone || "",
        address: address || "",
        password: await hashPassword(password),
      })
      .returning();
    const { password: _pw, ...safe } = inserted[0];
    return NextResponse.json({ student: safe }, { status: 201 });
  } catch (e: any) {
    if (String(e?.message).includes("UNIQUE")) {
      return NextResponse.json({ error: "এই রোল নাম্বার ইতিমধ্যে ব্যবহৃত হয়েছে" }, { status: 409 });
    }
    return NextResponse.json({ error: "সমস্যা হয়েছে" }, { status: 500 });
  }
}
