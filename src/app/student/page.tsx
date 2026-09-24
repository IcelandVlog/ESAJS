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
  if (!student || !student.approved) redirect("/login");

  // Only pass what the page needs — never the password hash / reset code.
  const details = {
    name: student.name,
    email: student.roll,
    // Some older accounts have the email typed into the phone field — show an empty
    // mobile box for those so the student can enter their real number.
    phone: student.phone && !student.phone.includes("@") ? student.phone : "",
    batch: student.batch ?? "",
    dateOfBirth: student.dateOfBirth ?? "",
    bloodGroup: student.bloodGroup ?? "",
    fatherName: student.fatherName ?? "",
    motherName: student.motherName ?? "",
    address: student.address ?? "",
  };

  return <StudentView initialDetails={details} />;
}
