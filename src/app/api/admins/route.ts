import { NextRequest, NextResponse } from "next/server";
import { count, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { admins, students } from "@/db/schema";
import { getMainAdmin, MAX_ADMINS_PER_BATCH } from "@/lib/staff";
import { NON_STUDENT_BATCH, isValidBatch } from "@/lib/validation";

// Main admin only: list the batch admins (never returns password hashes).
export async function GET() {
  if (!(await getMainAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select({ id: admins.id, name: admins.name, username: admins.username, batch: admins.batch, createdAt: admins.createdAt })
    .from(admins)
    .where(isNotNull(admins.batch))
    .orderBy(desc(admins.batch), admins.id);
  return NextResponse.json({ admins: rows, maxPerBatch: MAX_ADMINS_PER_BATCH });
}

// Main admin only: make an existing student the admin of their own batch (max 2 per batch).
// The admin account copies the student's name, login id (email/roll), photo and password
// hash, so they sign in on the Admin login page with the same email and password they
// already use as a student. Nothing new to hand over.
export async function POST(req: NextRequest) {
  if (!(await getMainAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { studentId } = (await req.json()) as { studentId?: number };
  if (!Number.isInteger(studentId)) {
    return NextResponse.json({ error: "একজন শিক্ষার্থী বাছাই করুন" }, { status: 400 });
  }

  const [student] = await db.select().from(students).where(eq(students.id, studentId as number));
  if (!student) {
    return NextResponse.json({ error: "শিক্ষার্থী পাওয়া যায়নি" }, { status: 404 });
  }
  if (!student.approved) {
    return NextResponse.json({ error: "শুধু অনুমোদিত শিক্ষার্থীকে ব্যাচ অ্যাডমিন করা যাবে" }, { status: 400 });
  }
  const batch = student.batch || "";
  if (!isValidBatch(batch) || batch === NON_STUDENT_BATCH) {
    return NextResponse.json({ error: "এই শিক্ষার্থীর কোনো ব্যাচ (পাশের সাল) নেই" }, { status: 400 });
  }

  const [{ total }] = await db.select({ total: count() }).from(admins).where(eq(admins.batch, batch));
  if (Number(total) >= MAX_ADMINS_PER_BATCH) {
    return NextResponse.json(
      { error: `এই ব্যাচের জন্য ইতিমধ্যে ${MAX_ADMINS_PER_BATCH} জন অ্যাডমিন আছেন` },
      { status: 409 }
    );
  }

  try {
    const [created] = await db
      .insert(admins)
      .values({ name: student.name, username: student.roll, password: student.password, photoUrl: student.photoUrl, batch })
      .returning({ id: admins.id, name: admins.name, username: admins.username, batch: admins.batch, createdAt: admins.createdAt });
    return NextResponse.json({ admin: created }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string })?.code === "23505") {
      return NextResponse.json({ error: "এই শিক্ষার্থী ইতিমধ্যে অ্যাডমিন" }, { status: 409 });
    }
    console.error("CREATE BATCH ADMIN ERROR:", e);
    return NextResponse.json({ error: "সমস্যা হয়েছে, আবার চেষ্টা করুন" }, { status: 500 });
  }
}
