import { redirect } from "next/navigation";
import { getStaffAccess } from "@/lib/staff";
import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Main admin or batch admin; a deleted admin's old cookie no longer works.
  const access = await getStaffAccess();
  if (!access) {
    redirect("/login");
  }

  return (
    <>
      <DashboardHeader role="admin" name={access.name} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <AdminDashboard batch={access.batch} />
      </main>
      <SiteFooter />
    </>
  );
}
