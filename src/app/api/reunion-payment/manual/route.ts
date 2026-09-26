import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionRegistrations } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { studentById, currentTokenForBatch, findRegistration } from "@/lib/reunion";
import { getOfflineNumbers, type OfflineMethod } from "@/lib/payment";

const VALID_METHODS: OfflineMethod[] = ["bkash", "nagad", "rocket"];

// Student sent the fee by hand to the school's bKash/Nagad/Rocket number and is now
// submitting the TrxID + the number they sent it from, for an admin to verify later.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const student = await studentById(session.id);
  if (!student || !student.batch) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenRow = await currentTokenForBatch(student.batch);
  if (!tokenRow || tokenRow.feeAmount <= 0) {
    return NextResponse.json({ error: "এই রিইউনিয়নের জন্য কোনো ফি নেই" }, { status: 400 });
  }

  const registration = await findRegistration(student.id, tokenRow.id);
  if (!registration) {
    return NextResponse.json({ error: "আগে জয়েন কোড দিয়ে রিইউনিয়নে যুক্ত হোন" }, { status: 400 });
  }
  if (registration.paymentStatus === "paid") {
    return NextResponse.json({ error: "ফি ইতিমধ্যে পরিশোধ করা হয়েছে" }, { status: 400 });
  }

  const { method, senderNumber, transactionId } = (await req.json()) as {
    method?: string;
    senderNumber?: string;
    transactionId?: string;
  };

  if (!method || !VALID_METHODS.includes(method as OfflineMethod)) {
    return NextResponse.json({ error: "পেমেন্ট মাধ্যম বাছাই করুন" }, { status: 400 });
  }
  const offlineNumbers = getOfflineNumbers();
  if (!offlineNumbers[method as OfflineMethod]) {
    return NextResponse.json({ error: "এই মাধ্যমটি এখন চালু নেই" }, { status: 400 });
  }
  const senderNumberText = senderNumber?.trim() || "";
  const transactionIdText = transactionId?.trim() || "";
  if (!senderNumberText || !transactionIdText) {
    return NextResponse.json({ error: "যে নম্বর থেকে টাকা পাঠিয়েছেন এবং TrxID দিন" }, { status: 400 });
  }

  const [updated] = await db
    .update(reunionRegistrations)
    .set({
      paymentMethod: method,
      senderNumber: senderNumberText,
      transactionId: transactionIdText,
      paymentStatus: "pending",
      amountPaid: tokenRow.feeAmount,
    })
    .where(eq(reunionRegistrations.id, registration.id))
    .returning();

  return NextResponse.json({
    payment: {
      paymentStatus: updated.paymentStatus,
      paymentMethod: updated.paymentMethod,
      transactionId: updated.transactionId,
      amountPaid: updated.amountPaid,
    },
  });
}
