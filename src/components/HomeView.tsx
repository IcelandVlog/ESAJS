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

type ReunionInfo = {
  occasion: string;
  venue?: string;
  reunionDate: string;
};

function useCountdown(target: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!target) return;
    const targetMs = new Date(target).getTime();
    const tick = () => setRemaining(targetMs - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (remaining === null) return null;
  const clamped = Math.max(0, remaining);
  return {
    started: remaining <= 0,
    days: Math.floor(clamped / (1000 * 60 * 60 * 24)),
    hours: Math.floor((clamped / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((clamped / (1000 * 60)) % 60),
    seconds: Math.floor((clamped / 1000) % 60),
  };
}

function ReunionCountdown({ reunion }: { reunion: ReunionInfo | null }) {
  const { t, lang } = useLanguage();
  const countdown = useCountdown(reunion?.reunionDate ?? null);

  if (!reunion || !countdown) return null;

  const dateStr = new Date(reunion.reunionDate).toLocaleString(lang === "bn" ? "bn-BD" : "en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
      <div className="bg-surface border border-line rounded-xl shadow-lg p-6 sm:p-8 text-center">
        <p className="text-xs uppercase tracking-widest text-ink/50 mb-1">{t("home.reunion.eyebrow")}</p>
        <h2 className="font-display text-2xl text-heading mb-1">🎉 {reunion.occasion}</h2>
        <p className="text-sm text-ink/60 mb-5">{dateStr}</p>
        {reunion.venue && <p className="text-sm text-ink/60 -mt-4 mb-5">📍 {reunion.venue}</p>}

        {countdown.started ? (
          <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-brand-pink bg-clip-text text-transparent">
            {t("home.reunion.started")}
          </p>
        ) : (
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            {[
              [countdown.days, t("home.reunion.days")],
              [countdown.hours, t("home.reunion.hours")],
              [countdown.minutes, t("home.reunion.minutes")],
              [countdown.seconds, t("home.reunion.seconds")],
            ].map(([value, label], i) => (
              <div key={i} className="flex flex-col items-center min-w-[56px]">
                <span className="font-display text-2xl sm:text-3xl text-heading tabular-nums">
                  {String(value).padStart(2, "0")}
                </span>
                <span className="text-xs text-ink/50 mt-1">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function HomeView({ notices, photos }: { notices: Notice[]; photos: GalleryPhoto[] }) {
  const { t } = useLanguage();
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [reunion, setReunion] = useState<ReunionInfo | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        setLoggedIn(!!data.session);
        setRole(data.session?.role ?? null);
        // Batch-scoped on purpose: this calls the same endpoint as /reunion, which
        // only ever returns the logged-in student's own batch's reunion. Other
        // batches' reunions (or anything shown while logged out) never reach here.
        if (data.session?.role === "student") {
          fetch("/api/reunion-register")
            .then((r) => r.json())
            .then((d) => setReunion(d.reunion || null))
            .catch(() => setReunion(null));
        }
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

        <ReunionCountdown reunion={reunion} />

        <Gallery photos={photos} />

        <NoticeBoard notices={notices} />
      </main>
      <SiteFooter />
    </>
  );
}
