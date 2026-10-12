"use client";

import { useEffect } from "react";
import { IconGoogle, IconFacebook } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Facebook login is on hold until the Meta app is published. While false, the
// Facebook button opens a "not available right now" page instead of Facebook.
// Set to true once the app is Live to switch the real Facebook login back on.
const FACEBOOK_LOGIN_ENABLED = false;

export default function SocialLoginButtons() {
  const { t } = useLanguage();

  // When the user comes back via "/login#social-login", bring the Google /
  // Facebook buttons into view.
  useEffect(() => {
    if (window.location.hash === "#social-login") {
      document.getElementById("social-login")?.scrollIntoView({ block: "center" });
    }
  }, []);

  return (
    <div id="social-login" className="space-y-3 scroll-mt-24">
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
          href={FACEBOOK_LOGIN_ENABLED ? "/api/auth/oauth/facebook" : "/facebook-unavailable"}
          className="flex items-center justify-center gap-2 rounded-xl bg-paper dark:bg-white/5 border border-line py-3 text-sm font-medium text-heading hover:bg-white/10 transition-colors"
        >
          <IconFacebook />
          {t("oauth.facebook")}
        </a>
      </div>
    </div>
  );
}
