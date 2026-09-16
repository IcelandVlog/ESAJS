"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Notice = {
  id: number;
  title: string;
  content: string;
  date: string;
};

export default function HomeView({ notices }: { notices: Notice[] }) {
  const { t } = useLanguage();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setLoggedIn(!!data.session))
      .catch(() => setLoggedIn(false));
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative bg-navy-950 text-white bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero.jpg')" }}
        >
          <div className="absolute inset-0 bg-navy-950/40" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
            <p className="text-white/70 tracking-widest text-sm mb-4 uppercase">{t("hero.eyebrow")}</p>
            <h1 className="font-hero font-extrabold uppercase tracking-tight text-4xl sm:text-6xl leading-tight mb-5 drop-shadow-lg">
              {t("hero.title")}
            </h1>
            <p className="text-white/85 max-w-xl mx-auto leading-relaxed mb-8">{t("hero.subtitle")}</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href={loggedIn ? "/profile" : "/register"}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold uppercase tracking-wide text-white bg-gradient-to-r from-brand-blue to-blue-600 hover:opacity-90 transition-opacity shadow-lg shadow-black/30"
              >
                {loggedIn && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                    <line x1="6" y1="15" x2="10" y2="15" />
                  </svg>
                )}
                {loggedIn ? t("hero.reunionCard") : t("hero.register")}
              </Link>
              <a
                href="#notices"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-brand-pink hover:opacity-90 transition-opacity shadow-lg shadow-black/30"
              >
                {t("hero.viewNotices")}
              </a>
            </div>
          </div>
        </section>

        {/* Notices */}
        <section id="notices" className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex items-baseline justify-between mb-6 border-b border-line pb-3">
            <h2 className="font-display text-2xl text-heading">{t("notices.title")}</h2>
            <span className="text-sm text-ink/50">
              {notices.length} {t("notices.count")}
            </span>
          </div>

          {notices.length === 0 ? (
            <p className="text-ink/60 py-10 text-center">{t("notices.empty")}</p>
          ) : (
            <ul className="space-y-4">
              {notices.map((n) => (
                <li key={n.id} className="border border-line rounded-lg p-5 bg-surface shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-medium text-lg text-heading">{n.title}</h3>
                    <time className="text-xs text-ink/50 whitespace-nowrap mt-1">{n.date}</time>
                  </div>
                  <p className="text-ink/70 mt-2 leading-relaxed whitespace-pre-line">{n.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
