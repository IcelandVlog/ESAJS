"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer
      id="contact"
      className="bg-white dark:bg-navy-950 text-ink/70 dark:text-white/70 mt-auto border-t border-line dark:border-white/10"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <Image
            src="/images/logo.png"
            alt="ESAJS"
            width={140}
            height={40}
            className="h-9 w-auto object-contain mb-3 rounded"
          />
          <p className="text-sm leading-relaxed max-w-xs">{t("hero.subtitle")}</p>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-heading dark:text-white font-medium mb-2">{t("nav.contact")}</p>
          <a href="mailto:esajs.official@gmail.com" className="flex items-center gap-2 hover:text-heading dark:hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 6L2 7" />
            </svg>
            esajs.official@gmail.com
          </a>
          <a href="tel:+8801753680383" className="flex items-center gap-2 hover:text-heading dark:hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            +880 1753-680383
          </a>
          <p className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {t("footer.location")}
          </p>
        </div>
        <div className="text-sm sm:text-right">
          <p>
            © {new Date().getFullYear()} {t("school.shortName")} — {t("school.assocName")}
          </p>
          <p className="mt-1">{t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
