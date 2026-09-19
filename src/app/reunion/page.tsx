import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ReunionRegisterView from "@/components/ReunionRegisterView";

export const dynamic = "force-dynamic";

export default async function ReunionPage() {
  const session = await getSession();
  if (!session || session.role !== "student") {
    redirect("/login");
  }

  return <ReunionRegisterView name={session.name} />;
}
