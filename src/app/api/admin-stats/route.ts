import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionRegistrations } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { sql } from "drizzle-orm";

// Admin dashboard: how many students confirmed attendance for each reunion code.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      tokenId: reunionRegistrations.reunionTokenId,
      count: sql<number>`count(*)`,
    })
    .from(reunionRegistrations)
    .groupBy(reunionRegistrations.reunionTokenId);

  const attendeesByToken: Record<number, number> = {};
  for (const r of rows) attendeesByToken[r.tokenId] = Number(r.count);
  return NextResponse.json({ attendeesByToken });
}
