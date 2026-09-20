"use client";

import { IconGoogle, IconFacebook } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function SocialLoginButtons() {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-line" />
        <span className="text-xs text-ink/40">{t("oauth.or")}</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a
          href="/api/auth/oauth/google"
          className="flex items-center justify-center gap-2 rounded-xl bg-paper dark:bg-white/5 border border-line py-3 text-sm font-medium text-heading hover:bg-white/10 transition-colors"
        >
          <IconGoogle />
          {t("oauth.google")}
        </a>
        <a
          href="/api/auth/oauth/facebook"
          className="flex items-center justify-center gap-2 rounded-xl bg-paper dark:bg-white/5 border border-line py-3 text-sm font-medium text-heading hover:bg-white/10 transition-colors"
        >
          <IconFacebook />
          {t("oauth.facebook")}
        </a>
      </div>
    </div>
  );
}
