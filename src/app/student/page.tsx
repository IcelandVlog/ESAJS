import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/db/client";
import { students, results, attendance } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import StudentView from "@/components/StudentView";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const session = await getSession();
  if (!session || session.role !== "student") {
    redirect("/login");
  }

  const [student] = await db.select().from(students).where(eq(students.id, session.id));
  if (!student) redirect("/login");

  const myResults = await db
    .select()
    .from(results)
    .where(eq(results.studentId, session.id))
    .orderBy(desc(results.id));

  const myAttendance = await db
    .select()
    .from(attendance)
    .where(eq(attendance.studentId, session.id))
    .orderBy(desc(attendance.date));

  const presentCount = myAttendance.filter((a) => a.status === "present").length;
  const attendanceRate = myAttendance.length ? Math.round((presentCount / myAttendance.length) * 100) : null;

  // group results by exam
  const examGroups = new Map<string, typeof myResults>();
  for (const r of myResults) {
    if (!examGroups.has(r.examName)) examGroups.set(r.examName, []);
    examGroups.get(r.examName)!.push(r);
  }

  return (
    <StudentView
      student={student}
      examGroups={Array.from(examGroups.entries())}
      myAttendance={myAttendance}
      attendanceRate={attendanceRate}
    />
  );
}
