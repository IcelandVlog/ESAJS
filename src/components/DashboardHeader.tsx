"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function DashboardHeader({
  role,
  name,
}: {
  role: "admin" | "student";
  name: string;
}) {
  const router = useRouter();
  const { t } = useLanguage();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="bg-pine text-paper border-b-4 border-gold">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <Link href="/" className="text-xs text-paper/60 hover:text-gold">
            {t("dash.backHome")}
          </Link>
          <h1 className="font-display text-xl mt-0.5">
            {role === "admin" ? t("dash.adminPanel") : t("dash.studentPortal")}
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-paper/80">{name}</span>
          <button
            onClick={handleLogout}
            className="border border-paper/40 rounded px-3 py-1.5 hover:bg-gold hover:text-pine-dark hover:border-gold transition-colors"
          >
            {t("nav.logout")}
          </button>
        </div>
      </div>
    </header>
  );
}
