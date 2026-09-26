import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionTokens, reunionRegistrations } from "@/db/schema";
import { getStaffAccess } from "@/lib/staff";
import { eq } from "drizzle-orm";

// Admin: verify (mark "paid") or reject (send back to "unpaid" so the student can
// resubmit) a manually-reported bKash/Nagad/Rocket payment. Never touches "online"
// payments — those are only ever confirmed automatically by the gateway.
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

  const { action } = (await req.json()) as { action?: "verify" | "reject" };
  if (action !== "verify" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (registration.paymentMethod === "online") {
    return NextResponse.json({ error: "অনলাইন পেমেন্ট স্বয়ংক্রিয়ভাবে যাচাই হয়, এখানে পরিবর্তন করা যাবে না" }, { status: 400 });
  }

  const [updated] = await db
    .update(reunionRegistrations)
    .set(
      action === "verify"
        ? { paymentStatus: "paid", paidAt: new Date() }
        : { paymentStatus: "unpaid", transactionId: "", senderNumber: "", amountPaid: 0 }
    )
    .where(eq(reunionRegistrations.id, regId))
    .returning();

  return NextResponse.json({ registration: updated });
}
