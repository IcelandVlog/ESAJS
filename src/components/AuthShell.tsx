"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import LangToggle from "@/components/LangToggle";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <main className="flex-1 flex flex-col bg-paper dark:bg-gradient-to-b dark:from-navy-900 dark:to-navy-950">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <Link
          href="/"
          className="text-sm text-ink/60 hover:text-heading transition-colors"
        >
          {t("login.backHome")}
        </Link>
        <div className="flex items-center gap-3">
          <LangToggle />
          <ThemeToggle className="text-navy-900 dark:text-white" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 pb-16 pt-4">
        <div className={`w-full ${wide ? "max-w-md" : "max-w-sm"}`}>
          <div className="rounded-2xl border border-line bg-surface p-7 sm:p-8 shadow-xl shadow-navy-900/5 dark:shadow-black/40">
            <Image
              src="/images/logo.png"
              alt="ESAJS"
              width={140}
              height={40}
              className="h-9 w-auto object-contain mx-auto mb-6 rounded"
              priority
            />

            <h1 className="text-2xl sm:text-3xl font-bold text-heading text-center">{title}</h1>
            {subtitle && (
              <p className="text-center text-ink/60 text-sm mt-2 mb-7">{subtitle}</p>
            )}
            {!subtitle && <div className="mb-7" />}

            {children}
          </div>

          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </div>
    </main>
  );
}
