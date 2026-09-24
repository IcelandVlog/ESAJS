import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { getStaffAccess } from "@/lib/staff";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const access = await getStaffAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // A batch admin only ever sees their own batch.
  const all = access.batch
    ? await db.select().from(students).where(eq(students.batch, access.batch)).orderBy(desc(students.id))
    : await db.select().from(students).orderBy(desc(students.id));
  // never leak password hashes
  const safe = all.map(({ password, ...rest }) => rest);
  return NextResponse.json({ students: safe });
}

export async function POST(req: NextRequest) {
  const access = await getStaffAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { name, className, section, batch: requestedBatch, fatherName, motherName, phone, address, bloodGroup, dateOfBirth, password } = body;
  // A batch admin can only add students to their own batch, whatever the request says.
  const batch = access.batch ?? requestedBatch;
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
        dateOfBirth: dateOfBirth || null,
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
