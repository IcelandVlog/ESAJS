"use client";

import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { IconFacebook } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function FacebookUnavailablePage() {
  const { t } = useLanguage();

  return (
    <AuthShell title={t("oauth.fbUnavailableTitle")}>
      <div className="flex justify-center mb-4 opacity-70">
        <IconFacebook />
      </div>
      <p className="text-center text-ink/70 text-sm leading-relaxed mb-7">{t("oauth.fbUnavailableBody")}</p>
      <Link
        href="/login#social-login"
        className="block w-full text-center rounded-xl py-3 font-bold text-white bg-gradient-to-r from-sky-400 to-cyan-400 hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/25"
      >
        {t("oauth.fbUnavailableBack")}
      </Link>
    </AuthShell>
  );
}
