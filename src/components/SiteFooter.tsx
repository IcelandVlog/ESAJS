"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer id="contact" className="bg-navy-950 text-white/70 mt-auto border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <Image
            src="/images/logo.png"
            alt="ESAJS"
            width={140}
            height={40}
            className="h-9 w-auto object-contain mb-3"
          />
          <p className="text-sm leading-relaxed max-w-xs">{t("hero.subtitle")}</p>
        </div>
        <div className="text-sm">
          <p className="text-white font-medium mb-2">{t("nav.contact")}</p>
          <p>esajs.official@gmail.com</p>
          <p className="mt-1">{t("footer.location")}</p>
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
