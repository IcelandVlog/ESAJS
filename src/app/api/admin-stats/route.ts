import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionRegistrations, reunionTokens } from "@/db/schema";
import { getStaffAccess } from "@/lib/staff";
import { eq, sql } from "drizzle-orm";

// Admin dashboard: how many students confirmed attendance for each reunion code.
export async function GET() {
  const access = await getStaffAccess();
  if (!access) {
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
  // A batch admin only gets numbers for their own batch's reunions.
  let allowed: Set<number> | null = null;
  if (access.batch) {
    const own = await db.select({ id: reunionTokens.id }).from(reunionTokens).where(eq(reunionTokens.batch, access.batch));
    allowed = new Set(own.map((o) => o.id));
  }
  for (const r of rows) {
    if (allowed && !allowed.has(r.tokenId)) continue;
    attendeesByToken[r.tokenId] = Number(r.count);
  }
  return NextResponse.json({ attendeesByToken });
}
