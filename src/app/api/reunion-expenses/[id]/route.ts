import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionTokens, reunionExpenses } from "@/db/schema";
import { getStaffAccess } from "@/lib/staff";
import { eq } from "drizzle-orm";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await getStaffAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const expenseId = Number(id);
  if (!Number.isInteger(expenseId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [expenseRow] = await db.select().from(reunionExpenses).where(eq(reunionExpenses.id, expenseId));
  if (!expenseRow) {
    return NextResponse.json({ error: "খরচ পাওয়া যায়নি" }, { status: 404 });
  }

  if (access.batch) {
    const [tokenRow] = await db
      .select({ batch: reunionTokens.batch })
      .from(reunionTokens)
      .where(eq(reunionTokens.id, expenseRow.reunionTokenId));
    if (!tokenRow || tokenRow.batch !== access.batch) {
      return NextResponse.json({ error: "এটি আপনার ব্যাচের রিইউনিয়ন নয়" }, { status: 403 });
    }
  }

  await db.delete(reunionExpenses).where(eq(reunionExpenses.id, expenseId));
  return NextResponse.json({ ok: true });
}
