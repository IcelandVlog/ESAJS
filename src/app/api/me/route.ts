import { NextResponse } from "next/server";
import { getSession, isStaffRole } from "@/lib/auth";
import { db } from "@/db/client";
import { admins, students } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ session: null });

  const table = isStaffRole(session.role) ? admins : students;
  const [row] = await db.select().from(table).where(eq(table.id, session.id));

  // The site treats batch admins as "admin" everywhere in the UI (they use the same admin panel).
  const role = session.role === "batch_admin" ? "admin" : session.role;
  return NextResponse.json({ session: { ...session, role, photoUrl: row?.photoUrl ?? null } });
}
