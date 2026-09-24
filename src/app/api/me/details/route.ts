import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, signSession, COOKIE_NAME } from "@/lib/auth";
import { EMAIL_RULE, MOBILE_RULE, BLOOD_GROUPS, NON_STUDENT_BATCH, isValidBatch, isValidDob } from "@/lib/validation";

const MAX_TEXT = 200;

type Body = {
  name?: string;
  email?: string;
  phone?: string;
  batch?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  fatherName?: string;
  motherName?: string;
  address?: string;
  className?: string;
  section?: string;
};

// A logged-in student edits their own details. Everything except the password
// and the admin-controlled "approved" flag can be changed here.
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "লগইন প্রয়োজন" }, { status: 401 });
  }

  const [current] = await db.select().from(students).where(eq(students.id, session.id));
  if (!current || !current.approved) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Body;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const name = str(body.name);
  const email = str(body.email);
  const phone = str(body.phone);
  const batch = str(body.batch);
  const dob = str(body.dateOfBirth);
  const bloodGroup = str(body.bloodGroup);
  const fatherName = str(body.fatherName);
  const motherName = str(body.motherName);
  const address = str(body.address);
  const className = str(body.className);
  const section = str(body.section);

  if (!name) return NextResponse.json({ error: "নাম দিন" }, { status: 400 });
  if (!EMAIL_RULE.test(email)) return NextResponse.json({ error: "সঠিক ইমেইল দিন" }, { status: 400 });
  if (phone && !MOBILE_RULE.test(phone)) return NextResponse.json({ error: "সঠিক মোবাইল নম্বর দিন" }, { status: 400 });
  if (!isValidBatch(batch)) return NextResponse.json({ error: "সঠিক ব্যাচ নির্বাচন করুন" }, { status: 400 });
  // Batch type is decided at registration/admin approval: a non-student can't turn
  // themselves into a batch member here, and a school student can't become "other".
  if ((current.batch === NON_STUDENT_BATCH) !== (batch === NON_STUDENT_BATCH)) {
    return NextResponse.json({ error: "এই ব্যাচ পরিবর্তন করা যাবে না" }, { status: 403 });
  }
  if (dob && !isValidDob(dob)) return NextResponse.json({ error: "সঠিক জন্ম তারিখ দিন" }, { status: 400 });
  if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup)) {
    return NextResponse.json({ error: "সঠিক ব্লাড গ্রুপ বাছাই করুন" }, { status: 400 });
  }
  for (const v of [name, email, fatherName, motherName, address, className, section]) {
    if (v.length > MAX_TEXT) return NextResponse.json({ error: "লেখা অনেক বড়" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(students)
      .set({
        name,
        roll: email, // the email doubles as the login identifier
        phone,
        batch,
        dateOfBirth: dob || null,
        bloodGroup: bloodGroup || null,
        fatherName,
        motherName,
        address,
        className,
        section,
      })
      .where(eq(students.id, session.id))
      .returning();

    // Session carries the name, so refresh it in case the name changed.
    const token = signSession({ role: "student", id: updated.id, name: updated.name });
    const res = NextResponse.json({
      ok: true,
      details: {
        name: updated.name,
        email: updated.roll,
        phone: updated.phone ?? "",
        batch: updated.batch ?? "",
        dateOfBirth: updated.dateOfBirth ?? "",
        bloodGroup: updated.bloodGroup ?? "",
        fatherName: updated.fatherName ?? "",
        motherName: updated.motherName ?? "",
        address: updated.address ?? "",
        className: updated.className ?? "",
        section: updated.section ?? "",
      },
    });
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
      return NextResponse.json({ error: "এই ইমেইল দিয়ে ইতিমধ্যে একজন সদস্য আছে" }, { status: 409 });
    }
    console.error("UPDATE DETAILS ERROR:", e?.code, e?.message);
    return NextResponse.json({ error: "সমস্যা হয়েছে, আবার চেষ্টা করুন" }, { status: 500 });
  }
}
