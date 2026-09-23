import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";

// Today's month/day in the school's own timezone, not the server's — so the
// popup flips over at local midnight in Bangladesh regardless of where the
// app happens to be hosted.
function todayMonthDay(): { month: string; day: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return {
    month: parts.find((p) => p.type === "month")!.value,
    day: parts.find((p) => p.type === "day")!.value,
  };
}

// Public on purpose: the birthday wish is meant to be seen by every visitor,
// not just the birthday student, so this needs no session/auth check. Only
// name + photo are exposed — nothing else from the student record.
export async function GET() {
  const { month, day } = todayMonthDay();
  const all = await db.select().from(students).where(eq(students.approved, true));

  const birthdays = all
    .filter((s) => {
      if (!s.dateOfBirth) return false;
      const parts = s.dateOfBirth.split("-"); // ["YYYY", "MM", "DD"]
      return parts.length === 3 && parts[1] === month && parts[2] === day;
    })
    .map((s) => ({ id: s.id, name: s.name, photoUrl: s.photoUrl }));

  return NextResponse.json({ birthdays });
}
