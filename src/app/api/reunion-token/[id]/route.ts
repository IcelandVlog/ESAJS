import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionTokens } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

// Admin: edit a reunion's date/occasion/venue, or cancel/reactivate it.
// Editing here never re-sends SMS/email — it only updates what students
// and the homepage see (the /reunion page and countdown read live from this row).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tokenId = Number(id);
  if (!Number.isInteger(tokenId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await req.json()) as {
    occasion?: string;
    messageBody?: string;
    venue?: string;
    reunionDate?: string;
    cancelled?: boolean;
  };

  const updates: Partial<typeof reunionTokens.$inferInsert> = {};

  if (body.occasion !== undefined) {
    const occasionText = body.occasion.trim();
    if (!occasionText) {
      return NextResponse.json({ error: "উপলক্ষ খালি রাখা যাবে না" }, { status: 400 });
    }
    updates.occasion = occasionText;
  }
  if (body.messageBody !== undefined) updates.messageBody = body.messageBody.trim();
  if (body.venue !== undefined) updates.venue = body.venue.trim();
  if (body.reunionDate !== undefined) {
    const d = new Date(body.reunionDate);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "সঠিক তারিখ ও সময় দিন" }, { status: 400 });
    }
    updates.reunionDate = d;
  }
  if (body.cancelled !== undefined) updates.cancelled = body.cancelled;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "কিছু পরিবর্তন করার জন্য দিন" }, { status: 400 });
  }

  const [updated] = await db.update(reunionTokens).set(updates).where(eq(reunionTokens.id, tokenId)).returning();
  if (!updated) {
    return NextResponse.json({ error: "টোকেন পাওয়া যায়নি" }, { status: 404 });
  }

  return NextResponse.json({ token: updated });
}
