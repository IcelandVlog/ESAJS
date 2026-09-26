import { db } from "@/db/client";
import { reunionTokens, reunionRegistrations, students } from "@/db/schema";
import { and, asc, eq, gte } from "drizzle-orm";

// How long a reunion stays "live" (card on the home page, code entry, etc.)
// after its start time. Once this much time has passed the reunion is treated
// as finished and disappears from the student-facing pages.
// Change this number to keep it visible for shorter/longer.
export const REUNION_VISIBLE_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours

export function hasReunionEnded(reunionDate: Date | string | null | undefined, now: number = Date.now()): boolean {
  if (!reunionDate) return false;
  return new Date(reunionDate).getTime() + REUNION_VISIBLE_AFTER_MS < now;
}

export async function studentById(sessionId: number) {
  const [student] = await db.select().from(students).where(eq(students.id, sessionId));
  return student ?? null;
}

// The batch's current reunion: not cancelled and not yet finished. When there is
// more than one, the soonest one wins. Finished reunions never come back.
export async function currentTokenForBatch(batch: string) {
  const cutoff = new Date(Date.now() - REUNION_VISIBLE_AFTER_MS);
  const [row] = await db
    .select()
    .from(reunionTokens)
    .where(and(eq(reunionTokens.batch, batch), eq(reunionTokens.cancelled, false), gte(reunionTokens.reunionDate, cutoff)))
    .orderBy(asc(reunionTokens.reunionDate))
    .limit(1);
  return row ?? null;
}

// A student's registration row for a given reunion token, if they've joined it.
export async function findRegistration(studentId: number, reunionTokenId: number) {
  const [row] = await db
    .select()
    .from(reunionRegistrations)
    .where(and(eq(reunionRegistrations.studentId, studentId), eq(reunionRegistrations.reunionTokenId, reunionTokenId)));
  return row ?? null;
}
