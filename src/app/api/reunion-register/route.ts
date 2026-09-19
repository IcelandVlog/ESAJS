import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionTokens, reunionRegistrations, students } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, desc, eq } from "drizzle-orm";

async function currentStudent(sessionId: number) {
  const [student] = await db.select().from(students).where(eq(students.id, sessionId));
  return student ?? null;
}

async function latestTokenForBatch(batch: string) {
  const [row] = await db
    .select()
    .from(reunionTokens)
    .where(and(eq(reunionTokens.batch, batch), eq(reunionTokens.cancelled, false)))
    .orderBy(desc(reunionTokens.id))
    .limit(1);
  return row ?? null;
}

// Student view: is there a reunion announced for my batch, and have I registered for it?
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await currentStudent(session.id);
  if (!student || !student.batch) {
    return NextResponse.json({ reunion: null, registered: false });
  }

  const tokenRow = await latestTokenForBatch(student.batch);
  if (!tokenRow) {
    return NextResponse.json({ reunion: null, registered: false });
  }

  const [existing] = await db
    .select()
    .from(reunionRegistrations)
    .where(and(eq(reunionRegistrations.studentId, student.id), eq(reunionRegistrations.reunionTokenId, tokenRow.id)));

  return NextResponse.json({
    reunion: {
      occasion: tokenRow.occasion,
      venue: tokenRow.venue,
      reunionDate: tokenRow.reunionDate,
    },
    registered: !!existing,
  });
}

// Student submits the entry code they received via SMS/email to confirm attendance.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await currentStudent(session.id);
  if (!student) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = (await req.json()) as { token?: string };
  const enteredToken = token?.trim().toUpperCase();
  if (!enteredToken) {
    return NextResponse.json({ error: "কোড লিখুন" }, { status: 400 });
  }

  const [tokenRow] = await db.select().from(reunionTokens).where(eq(reunionTokens.token, enteredToken));
  if (!tokenRow) {
    return NextResponse.json({ error: "ভুল কোড, আবার চেষ্টা করুন" }, { status: 400 });
  }
  // Same-batch rule: a code only registers members of the batch it was sent to.
  if (!student.batch || tokenRow.batch !== student.batch) {
    return NextResponse.json({ error: "এই কোডটি আপনার ব্যাচের জন্য নয়" }, { status: 403 });
  }
  if (tokenRow.cancelled) {
    return NextResponse.json({ error: "এই রিইউনিয়নটি বাতিল করা হয়েছে" }, { status: 410 });
  }

  const [existing] = await db
    .select()
    .from(reunionRegistrations)
    .where(and(eq(reunionRegistrations.studentId, student.id), eq(reunionRegistrations.reunionTokenId, tokenRow.id)));

  if (!existing) {
    await db.insert(reunionRegistrations).values({ studentId: student.id, reunionTokenId: tokenRow.id });
  }

  return NextResponse.json({
    reunion: {
      occasion: tokenRow.occasion,
      venue: tokenRow.venue,
      reunionDate: tokenRow.reunionDate,
    },
    registered: true,
    alreadyRegistered: !!existing,
  });
}
