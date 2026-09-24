import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, getSession, isStaffRole } from "@/lib/auth";
import { db } from "@/db/client";
import { admins, students } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    // No session — or the account was deleted while the cookie was still valid.
    // Drop a leftover cookie so the browser is fully logged out.
    const res = NextResponse.json({ session: null });
    if ((await cookies()).get(COOKIE_NAME)?.value) {
      res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
    }
    return res;
  }

  const table = isStaffRole(session.role) ? admins : students;
  const [row] = await db.select().from(table).where(eq(table.id, session.id));

  // The site treats batch admins as "admin" everywhere in the UI (they use the same admin panel).
  const role = session.role === "batch_admin" ? "admin" : session.role;
  return NextResponse.json({ session: { ...session, role, photoUrl: row?.photoUrl ?? null } });
}
