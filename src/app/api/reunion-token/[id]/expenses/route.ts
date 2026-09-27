import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionTokens, reunionExpenses } from "@/db/schema";
import { getStaffAccess } from "@/lib/staff";
import { eq } from "drizzle-orm";

// Admin logs a cost against a reunion (venue rent, food, decoration, etc.) so the
// finance summary can show money collected vs. money spent.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { title, amount } = (await req.json()) as { title?: string; amount?: number };
  const titleText = title?.trim() || "";
  const amountNum = Math.max(0, Math.round(Number(amount) || 0));
  if (!titleText || amountNum <= 0) {
    return NextResponse.json({ error: "খরচের বিবরণ ও টাকার পরিমাণ দিন" }, { status: 400 });
  }

  const [saved] = await db
    .insert(reunionExpenses)
    .values({ reunionTokenId: tokenId, title: titleText, amount: amountNum })
    .returning();

  return NextResponse.json({ expense: saved });
}
