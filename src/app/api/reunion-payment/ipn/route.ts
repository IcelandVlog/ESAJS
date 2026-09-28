import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionRegistrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateSslcommerzTransaction } from "@/lib/payment";

// SSLCommerz calls this server-to-server (not through the customer's browser), so it
// still marks the fee as paid even if the customer closes the tab right after paying
// before the /success redirect finishes. Idempotent: safe to call more than once.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const valId = String(form.get("val_id") || "");
  const tranId = String(form.get("tran_id") || "");

  const result = await validateSslcommerzTransaction(valId);
  if (result.valid && result.tranId === tranId) {
    const [registration] = await db
      .select()
      .from(reunionRegistrations)
      .where(eq(reunionRegistrations.transactionId, tranId));
    if (registration && registration.paymentStatus !== "paid") {
      await db
        .update(reunionRegistrations)
        .set({
          paymentStatus: "paid",
          amountPaid: result.amount ?? registration.amountPaid,
          valId: result.valId || valId,
          paidAt: new Date(),
        })
        .where(eq(reunionRegistrations.id, registration.id));
    }
  }

  return NextResponse.json({ ok: true });
}
