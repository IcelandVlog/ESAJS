import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionRegistrations } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { studentById, currentTokenForBatch, findRegistration } from "@/lib/reunion";
import { initiateSslcommerzPayment, isOnlinePaymentConfigured } from "@/lib/payment";

// Student has already joined the reunion (via /api/reunion-register) and now wants
// to pay the fee online. Starts an SSLCommerz session and hands back the checkout URL.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOnlinePaymentConfigured()) {
    return NextResponse.json({ error: "অনলাইন পেমেন্ট এখনো চালু করা হয়নি" }, { status: 400 });
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

  const tranId = `RU${registration.id}-${Date.now()}`;
  const origin = req.nextUrl.origin;
  const [email, phone] = [student.roll.includes("@") ? student.roll : "", student.phone || ""];

  const result = await initiateSslcommerzPayment({
    tranId,
    amount: tokenRow.feeAmount,
    studentName: student.name,
    studentEmail: email,
    studentPhone: phone,
    successUrl: `${origin}/api/reunion-payment/success`,
    failUrl: `${origin}/api/reunion-payment/fail`,
    cancelUrl: `${origin}/api/reunion-payment/cancel`,
    ipnUrl: `${origin}/api/reunion-payment/ipn`,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // Remember the tran_id now so the success/IPN callback can find this registration again.
  await db
    .update(reunionRegistrations)
    .set({ paymentMethod: "online", transactionId: tranId })
    .where(eq(reunionRegistrations.id, registration.id));

  return NextResponse.json({ url: result.gatewayUrl });
}
