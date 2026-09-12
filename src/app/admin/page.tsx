import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <>
      <DashboardHeader role="admin" name={session.name} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <AdminDashboard />
      </main>
      <SiteFooter />
    </>
  );
}
