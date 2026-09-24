import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { admins } from "@/db/schema";
import { getSession } from "@/lib/auth";

/** How many batch admins the main admin may create for one batch. */
export const MAX_ADMINS_PER_BATCH = 2;

export type StaffAccess = {
  id: number;
  name: string;
  /** null = main admin (everything). A batch year = batch admin, limited to that batch. */
  batch: string | null;
};

export const isMainAdmin = (a: StaffAccess) => a.batch === null;

/**
 * Who is calling, as an admin? Reads the admin row from the database on every
 * request (not just the login cookie), so a batch admin that the main admin
 * deletes loses access immediately instead of after the 7-day cookie expires.
 * Returns null for visitors, students and deleted admins.
 */
export async function getStaffAccess(): Promise<StaffAccess | null> {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "batch_admin")) return null;
  const [row] = await db.select().from(admins).where(eq(admins.id, session.id));
  if (!row) return null;
  return { id: row.id, name: row.name, batch: row.batch ?? null };
}

/** Main admin only (batch admins and everyone else get null). */
export async function getMainAdmin(): Promise<StaffAccess | null> {
  const access = await getStaffAccess();
  return access && isMainAdmin(access) ? access : null;
}
