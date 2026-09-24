"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Gallery from "@/components/Gallery";
import NoticeBoard from "@/components/NoticeBoard";
import type { GalleryPhoto } from "@/lib/gallery";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Notice = {
  id: number;
  title: string;
  content: string;
  date: string;
};

export default function HomeView({ notices, photos }: { notices: Notice[]; photos: GalleryPhoto[] }) {
  const { t } = useLanguage();
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        setLoggedIn(!!data.session);
        setRole(data.session?.role ?? null);
      })
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
                href={loggedIn ? (role === "admin" ? "/admin" : "/reunion") : "/register"}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold uppercase tracking-wide text-white bg-gradient-to-r from-brand-blue to-blue-600 hover:opacity-90 transition-opacity shadow-lg shadow-black/30"
              >
                {loggedIn && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                    <line x1="6" y1="15" x2="10" y2="15" />
                  </svg>
                )}
                {loggedIn ? (role === "admin" ? t("dash.adminPanel") : t("hero.reunionCard")) : t("hero.register")}
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

        <Gallery photos={photos} />

        <NoticeBoard notices={notices} />
      </main>
      <SiteFooter />
    </>
  );
}
