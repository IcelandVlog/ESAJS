import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { getStaffAccess, isMainAdmin } from "@/lib/staff";
import { and, eq, isNotNull, sql } from "drizzle-orm";

// Main admin: every batch that has approved members (and how many), so the reunion form
// can offer "All batches" with a separate fee for each one.
export async function GET() {
  const access = await getStaffAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isMainAdmin(access)) {
    return NextResponse.json({ error: "শুধু মেইন অ্যাডমিন সব ব্যাচ দেখতে পারবেন" }, { status: 403 });
  }

  const rows = await db
    .select({ batch: students.batch, count: sql<number>`count(*)::int` })
    .from(students)
    .where(and(eq(students.approved, true), isNotNull(students.batch)))
    .groupBy(students.batch);

  const batches = rows
    .filter((r) => r.batch)
    .map((r) => ({ batch: r.batch as string, count: Number(r.count) }))
    .sort((a, b) => Number(b.batch) - Number(a.batch) || b.batch.localeCompare(a.batch));

  return NextResponse.json({ batches });
}
