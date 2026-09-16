"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import LangToggle from "@/components/LangToggle";
import DefaultAvatar from "@/components/DefaultAvatar";

export default function SiteHeader() {
  const { t } = useLanguage();
  const [session, setSession] = useState<{ name: string; photoUrl: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setSession(data.session ?? null))
      .catch(() => setSession(null));
  }, []);

  return (
    <header className="bg-white dark:bg-navy-900 text-navy-900 dark:text-white sticky top-0 z-40 border-b border-line dark:border-transparent shadow-sm dark:shadow-lg dark:shadow-black/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/images/logo.png"
            alt="ESAJS"
            width={140}
            height={40}
            className="h-9 w-auto object-contain rounded"
            priority
          />
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-navy-900/70 dark:text-white/85">
          <Link href="/" className="hover:text-navy-900 dark:hover:text-white transition-colors">
            {t("nav.home")}
          </Link>
          <Link href="/#notices" className="hover:text-navy-900 dark:hover:text-white transition-colors">
            {t("nav.notices")}
          </Link>
          <Link href="/#gallery" className="hover:text-navy-900 dark:hover:text-white transition-colors">
            {t("nav.gallery")}
          </Link>
          <Link href="/#contact" className="hover:text-navy-900 dark:hover:text-white transition-colors">
            {t("nav.contact")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LangToggle />

          <ThemeToggle className="text-navy-900 dark:text-white" />

          {session ? (
            <Link
              href="/profile"
              aria-label={t("nav.profile")}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full overflow-hidden ring-2 ring-navy-900/15 dark:ring-white/25 hover:ring-navy-900/40 dark:hover:ring-white/60 transition-all shrink-0"
            >
              {session.photoUrl ? (
                <Image src={session.photoUrl} alt={session.name} width={40} height={40} className="w-full h-full object-cover" unoptimized />
              ) : (
                <DefaultAvatar className="w-full h-full" />
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-pink hover:opacity-90 transition-opacity"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
