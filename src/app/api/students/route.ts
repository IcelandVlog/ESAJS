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
  const { name, className, section, batch, fatherName, motherName, phone, address, bloodGroup, password } = body;
  if (!name || !phone || !password) {
    return NextResponse.json({ error: "নাম, যোগাযোগ ও পাসওয়ার্ড আবশ্যক" }, { status: 400 });
  }
  try {
    const inserted = await db
      .insert(students)
      .values({
        roll: String(phone).trim(),
        name,
        className: className || "",
        section: section || "",
        batch: batch || "",
        fatherName: fatherName || "",
        motherName: motherName || "",
        phone: phone || "",
        address: address || "",
        bloodGroup: bloodGroup || null,
        password: await hashPassword(password),
      })
      .returning();
    const { password: _pw, ...safe } = inserted[0];
    return NextResponse.json({ student: safe }, { status: 201 });
  } catch (e: any) {
    // Postgres unique-violation error code
    if (e?.code === "23505") {
      return NextResponse.json({ error: "এই মোবাইল/ইমেইল দিয়ে ইতিমধ্যে একজন সদস্য আছে" }, { status: 409 });
    }
    return NextResponse.json({ error: "সমস্যা হয়েছে" }, { status: 500 });
  }
}
