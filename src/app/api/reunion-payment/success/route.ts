import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionRegistrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateSslcommerzTransaction } from "@/lib/payment";

// SSLCommerz redirects the browser here with a POST (form body) once the customer
// finishes paying. We re-validate with SSLCommerz itself (never trust the redirect
// alone — anyone could POST a fake "success") before marking the fee as paid, then
// bounce the browser back to the /reunion page.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const valId = String(form.get("val_id") || "");
  const tranId = String(form.get("tran_id") || "");

  const result = await validateSslcommerzTransaction(valId);
  const origin = req.nextUrl.origin;

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
    return NextResponse.redirect(`${origin}/reunion?payment=success`, { status: 303 });
  }

  return NextResponse.redirect(`${origin}/reunion?payment=fail`, { status: 303 });
}
