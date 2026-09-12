"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function SiteHeader() {
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="bg-navy-900 text-white sticky top-0 z-40 shadow-lg shadow-black/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/images/logo.png"
            alt="ESAJS"
            width={140}
            height={40}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-white/85">
          <Link href="/" className="hover:text-white transition-colors">
            {t("nav.home")}
          </Link>
          <Link href="/#notices" className="hover:text-white transition-colors">
            {t("nav.notices")}
          </Link>
          <Link href="/#contact" className="hover:text-white transition-colors">
            {t("nav.contact")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-white/25 text-xs font-medium overflow-hidden">
            <button
              type="button"
              onClick={() => setLang("bn")}
              className={`px-2.5 py-1.5 transition-colors ${
                lang === "bn" ? "bg-white text-navy-900" : "text-white/70 hover:text-white"
              }`}
            >
              বাং
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2.5 py-1.5 transition-colors ${
                lang === "en" ? "bg-white text-navy-900" : "text-white/70 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-pink hover:opacity-90 transition-opacity"
          >
            {t("nav.login")}
          </Link>
        </div>
      </div>
    </header>
  );
}
