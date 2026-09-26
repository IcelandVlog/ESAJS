import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionTokens, reunionRegistrations } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { hasReunionEnded, studentById, currentTokenForBatch, findRegistration } from "@/lib/reunion";
import { getOfflineNumbers, getOfflinePayeeName, isOnlinePaymentConfigured } from "@/lib/payment";

function paymentInfo() {
  return {
    onlineAvailable: isOnlinePaymentConfigured(),
    offlineNumbers: getOfflineNumbers(),
    payeeName: getOfflinePayeeName(),
  };
}

function registrationPayment(row: typeof reunionRegistrations.$inferSelect | null | undefined) {
  if (!row) return null;
  return {
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    transactionId: row.transactionId,
    amountPaid: row.amountPaid,
  };
}

// Student view: is there a reunion announced for my batch, and have I registered for it?
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await studentById(session.id);
  if (!student || !student.batch) {
    return NextResponse.json({ reunion: null, registered: false });
  }

  const tokenRow = await currentTokenForBatch(student.batch);
  if (!tokenRow) {
    return NextResponse.json({ reunion: null, registered: false });
  }

  const existing = await findRegistration(student.id, tokenRow.id);

  return NextResponse.json({
    reunion: {
      occasion: tokenRow.occasion,
      venue: tokenRow.venue,
      reunionDate: tokenRow.reunionDate,
      feeAmount: tokenRow.feeAmount,
    },
    registered: !!existing,
    payment: registrationPayment(existing),
    paymentOptions: tokenRow.feeAmount > 0 ? paymentInfo() : null,
  });
}

// Student submits the entry code they received via SMS/email to confirm attendance.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await studentById(session.id);
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
  if (hasReunionEnded(tokenRow.reunionDate)) {
    return NextResponse.json({ error: "এই রিইউনিয়নটি শেষ হয়ে গেছে" }, { status: 410 });
  }

  const existing = await findRegistration(student.id, tokenRow.id);

  let saved = existing;
  if (!existing) {
    const [inserted] = await db
      .insert(reunionRegistrations)
      .values({ studentId: student.id, reunionTokenId: tokenRow.id })
      .returning();
    saved = inserted;
  }

  return NextResponse.json({
    reunion: {
      occasion: tokenRow.occasion,
      venue: tokenRow.venue,
      reunionDate: tokenRow.reunionDate,
      feeAmount: tokenRow.feeAmount,
    },
    registered: true,
    alreadyRegistered: !!existing,
    payment: registrationPayment(saved),
    paymentOptions: tokenRow.feeAmount > 0 ? paymentInfo() : null,
  });
}
