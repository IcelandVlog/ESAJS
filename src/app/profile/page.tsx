import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProfileView from "./ProfileView";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-16 bg-paper">
        <ProfileView role={session.role} name={session.name} />
      </main>
      <SiteFooter />
    </>
  );
}
