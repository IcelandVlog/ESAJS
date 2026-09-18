import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionTokens } from "@/db/schema";
import { asc, gte } from "drizzle-orm";

// Public, unauthenticated: returns only what the homepage countdown needs
// (header text + date). Never expose the token or batch here.
export async function GET() {
  const now = new Date();
  const rows = await db
    .select({ occasion: reunionTokens.occasion, reunionDate: reunionTokens.reunionDate })
    .from(reunionTokens)
    .where(gte(reunionTokens.reunionDate, now))
    .orderBy(asc(reunionTokens.reunionDate))
    .limit(1);

  return NextResponse.json({ reunion: rows[0] || null });
}
