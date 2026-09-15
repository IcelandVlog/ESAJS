"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ProfileView({
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
    <div className="w-full max-w-md">
      <h1 className="font-display text-2xl text-heading mb-2 text-center">{t("profile.title")}</h1>

      <div className="bg-surface border border-line rounded-lg p-6 text-center space-y-5">
        <div>
          <p className="text-ink/60 text-sm">{t("profile.loggedInAs")}</p>
          <p className="text-heading font-medium text-lg mt-1">{name}</p>
          <p className="text-ink/50 text-xs mt-0.5">
            {role === "admin" ? t("login.roleAdmin") : t("login.roleStudent")}
          </p>
        </div>

        <Link
          href={role === "admin" ? "/admin" : "/student"}
          className="block w-full bg-gradient-to-r from-brand-blue to-brand-pink text-white py-2.5 rounded font-medium hover:opacity-90 transition-opacity"
        >
          {role === "admin" ? t("profile.goToAdmin") : t("profile.goToStudent")}
        </Link>

        <button
          onClick={handleLogout}
          className="block w-full border border-line rounded py-2.5 text-sm text-ink/70 hover:bg-paper transition-colors"
        >
          {t("nav.logout")}
        </button>
      </div>
    </div>
  );
}
