import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db/client";
import { admins, students } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ session: null });

  const table = session.role === "admin" ? admins : students;
  const [row] = await db.select().from(table).where(eq(table.id, session.id));

  return NextResponse.json({ session: { ...session, photoUrl: row?.photoUrl ?? null } });
}
