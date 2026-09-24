import { redirect } from "next/navigation";
import { getSession, isStaffRole } from "@/lib/auth";
import { db } from "@/db/client";
import { admins, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProfileView from "./ProfileView";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const table = isStaffRole(session.role) ? admins : students;
  const [row] = await db.select().from(table).where(eq(table.id, session.id));

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-16 bg-paper">
        <ProfileView role={session.role === "student" ? "student" : "admin"} name={session.name} initialPhotoUrl={row?.photoUrl ?? null} />
      </main>
      <SiteFooter />
    </>
  );
}
