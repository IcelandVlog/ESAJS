import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionTokens, reunionRegistrations, students } from "@/db/schema";
import { getStaffAccess } from "@/lib/staff";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await getStaffAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tokenId = Number(id);
  if (!Number.isInteger(tokenId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [tokenRow] = await db.select().from(reunionTokens).where(eq(reunionTokens.id, tokenId));
  if (!tokenRow) {
    return NextResponse.json({ error: "টোকেন পাওয়া যায়নি" }, { status: 404 });
  }
  if (access.batch && tokenRow.batch !== access.batch) {
    return NextResponse.json({ error: "এটি আপনার ব্যাচের রিইউনিয়ন নয়" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: reunionRegistrations.id,
      studentName: students.name,
      studentRoll: students.roll,
      paymentStatus: reunionRegistrations.paymentStatus,
      paymentMethod: reunionRegistrations.paymentMethod,
      transactionId: reunionRegistrations.transactionId,
      senderNumber: reunionRegistrations.senderNumber,
      amountPaid: reunionRegistrations.amountPaid,
      createdAt: reunionRegistrations.createdAt,
    })
    .from(reunionRegistrations)
    .innerJoin(students, eq(students.id, reunionRegistrations.studentId))
    .where(eq(reunionRegistrations.reunionTokenId, tokenId))
    .orderBy(reunionRegistrations.id);

  return NextResponse.json({ registrations: rows.reverse() });
}
