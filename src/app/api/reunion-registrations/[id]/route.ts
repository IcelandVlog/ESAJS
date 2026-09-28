import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionTokens, reunionRegistrations } from "@/db/schema";
import { getStaffAccess } from "@/lib/staff";
import { eq } from "drizzle-orm";

// Admin payment actions on one registration:
//  - verify:     a student-reported bKash/Nagad/Rocket TrxID checked out -> "paid"
//  - reject:     send it back to "unpaid" so the student can resubmit
//  - markCash:   the student handed the full fee to the admin in person -> "paid" (cash)
//  - markUnpaid: undo a paid mark (e.g. it was clicked by mistake)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await getStaffAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const regId = Number(id);
  if (!Number.isInteger(regId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [registration] = await db.select().from(reunionRegistrations).where(eq(reunionRegistrations.id, regId));
  if (!registration) {
    return NextResponse.json({ error: "রেজিস্ট্রেশন পাওয়া যায়নি" }, { status: 404 });
  }

  if (access.batch) {
    const [tokenRow] = await db
      .select({ batch: reunionTokens.batch })
      .from(reunionTokens)
      .where(eq(reunionTokens.id, registration.reunionTokenId));
    if (!tokenRow || tokenRow.batch !== access.batch) {
      return NextResponse.json({ error: "এটি আপনার ব্যাচের রিইউনিয়ন নয়" }, { status: 403 });
    }
  }

  const { action } = (await req.json()) as { action?: "verify" | "reject" | "markCash" | "markUnpaid" };
  if (action !== "verify" && action !== "reject" && action !== "markCash" && action !== "markUnpaid") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  let updates: Partial<typeof reunionRegistrations.$inferInsert>;
  if (action === "verify") {
    updates = { paymentStatus: "paid", paidAt: new Date() };
  } else if (action === "markCash") {
    const [tokenRow] = await db
      .select({ feeAmount: reunionTokens.feeAmount })
      .from(reunionTokens)
      .where(eq(reunionTokens.id, registration.reunionTokenId));
    updates = {
      paymentStatus: "paid",
      paymentMethod: "cash",
      transactionId: "",
      senderNumber: "",
      amountPaid: tokenRow?.feeAmount ?? 0,
      paidAt: new Date(),
    };
  } else {
    updates = { paymentStatus: "unpaid", paymentMethod: "", transactionId: "", senderNumber: "", amountPaid: 0, paidAt: null };
  }

  const [updated] = await db.update(reunionRegistrations).set(updates).where(eq(reunionRegistrations.id, regId)).returning();

  return NextResponse.json({ registration: updated });
}
