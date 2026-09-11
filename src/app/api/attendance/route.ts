import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { attendance } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const studentIdParam = url.searchParams.get("studentId");
  const studentId = session.role === "student" ? session.id : studentIdParam ? Number(studentIdParam) : null;

  if (studentId) {
    const rows = await db
      .select()
      .from(attendance)
      .where(eq(attendance.studentId, studentId))
      .orderBy(desc(attendance.date));
    return NextResponse.json({ attendance: rows });
  }

  if (session.role === "admin") {
    const rows = await db.select().from(attendance).orderBy(desc(attendance.date));
    return NextResponse.json({ attendance: rows });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { studentId, date, status } = body;
  if (!studentId || !date || !status) {
    return NextResponse.json({ error: "সব ফিল্ড আবশ্যক" }, { status: 400 });
  }
  const inserted = await db
    .insert(attendance)
    .values({ studentId: Number(studentId), date, status })
    .returning();
  return NextResponse.json({ attendance: inserted[0] }, { status: 201 });
}
