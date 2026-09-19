import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import StudentView from "@/components/StudentView";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const session = await getSession();
  if (!session || session.role !== "student") {
    redirect("/login");
  }

  const [student] = await db.select().from(students).where(eq(students.id, session.id));
  if (!student) redirect("/login");

  return <StudentView student={student} />;
}
