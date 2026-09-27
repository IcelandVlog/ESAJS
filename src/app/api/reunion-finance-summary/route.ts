import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionTokens, reunionRegistrations, reunionExpenses } from "@/db/schema";
import { getStaffAccess } from "@/lib/staff";
import { eq, inArray } from "drizzle-orm";

// Money overview across every reunion this admin can see: how much each reunion has
// collected, how much is still due, how much has been spent, and the net balance.
// A batch admin only ever sees their own batch's reunions (same scoping as
// /api/reunion-token); the main admin sees every batch, plus a grand total.
export async function GET() {
  const access = await getStaffAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenRows = access.batch
    ? await db.select().from(reunionTokens).where(eq(reunionTokens.batch, access.batch))
    : await db.select().from(reunionTokens);

  const tokenIds = tokenRows.map((t) => t.id);
  const [regRows, expRows] = tokenIds.length
    ? await Promise.all([
        db
          .select({
            reunionTokenId: reunionRegistrations.reunionTokenId,
            paymentStatus: reunionRegistrations.paymentStatus,
            amountPaid: reunionRegistrations.amountPaid,
          })
          .from(reunionRegistrations)
          .where(inArray(reunionRegistrations.reunionTokenId, tokenIds)),
        db
          .select({ reunionTokenId: reunionExpenses.reunionTokenId, amount: reunionExpenses.amount })
          .from(reunionExpenses)
          .where(inArray(reunionExpenses.reunionTokenId, tokenIds)),
      ])
    : [[], []];

  const perToken = tokenRows.map((tk) => {
    const regs = regRows.filter((r) => r.reunionTokenId === tk.id);
    const collected = regs.filter((r) => r.paymentStatus === "paid").reduce((s, r) => s + r.amountPaid, 0);
    const dueCount = regs.filter((r) => r.paymentStatus !== "paid").length;
    const totalExpense = expRows.filter((e) => e.reunionTokenId === tk.id).reduce((s, e) => s + e.amount, 0);
    return {
      tokenId: tk.id,
      batch: tk.batch,
      occasion: tk.occasion,
      feeAmount: tk.feeAmount,
      collected,
      due: dueCount * tk.feeAmount,
      totalExpense,
      net: collected - totalExpense,
    };
  });

  const grandTotal = perToken.reduce(
    (acc, r) => ({
      collected: acc.collected + r.collected,
      due: acc.due + r.due,
      totalExpense: acc.totalExpense + r.totalExpense,
      net: acc.net + r.net,
    }),
    { collected: 0, due: 0, totalExpense: 0, net: 0 }
  );

  return NextResponse.json({ perToken, grandTotal, isMainAdmin: access.batch === null });
}
