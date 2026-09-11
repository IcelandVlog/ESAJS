import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { results } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const studentIdParam = url.searchParams.get("studentId");

  // Students can only see their own results
  const studentId = session.role === "student" ? session.id : studentIdParam ? Number(studentIdParam) : null;

  if (studentId) {
    const rows = await db.select().from(results).where(eq(results.studentId, studentId)).orderBy(desc(results.id));
    return NextResponse.json({ results: rows });
  }

  // Admin listing all
  if (session.role === "admin") {
    const rows = await db.select().from(results).orderBy(desc(results.id));
    return NextResponse.json({ results: rows });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { studentId, examName, subject, marks, fullMarks, grade } = body;
  if (!studentId || !examName || !subject || marks === undefined) {
    return NextResponse.json({ error: "সব ফিল্ড আবশ্যক" }, { status: 400 });
  }
  const inserted = await db
    .insert(results)
    .values({
      studentId: Number(studentId),
      examName,
      subject,
      marks: Number(marks),
      fullMarks: fullMarks ? Number(fullMarks) : 100,
      grade: grade || "",
    })
    .returning();
  return NextResponse.json({ result: inserted[0] }, { status: 201 });
}
