"use client";

import { IconGoogle, IconFacebook } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function SocialLoginButtons() {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <a
        href="/api/auth/oauth/google"
        className="flex items-center justify-center gap-3 w-full rounded-xl py-3 font-medium bg-white text-gray-700 border border-line hover:bg-gray-50 transition-colors"
      >
        <IconGoogle />
        {t("oauth.continueWithGoogle")}
      </a>
      <a
        href="/api/auth/oauth/facebook"
        className="flex items-center justify-center gap-3 w-full rounded-xl py-3 font-medium text-white bg-[#1877F2] hover:opacity-90 transition-opacity"
      >
        <IconFacebook className="[&_path]:fill-white" />
        {t("oauth.continueWithFacebook")}
      </a>

      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-line" />
        <span className="text-xs text-ink/40">{t("oauth.or")}</span>
        <div className="flex-1 h-px bg-line" />
      </div>
    </div>
  );
}
