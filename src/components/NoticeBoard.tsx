"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export type Notice = {
  id: number;
  title: string;
  content: string;
  date: string;
};

// Home page notice board. Each notice is a short preview card; clicking it opens
// the full notice (title, date, complete text) in a centred pop-up.
export default function NoticeBoard({ notices }: { notices: Notice[] }) {
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState<number | null>(null);
  const active = notices.find((n) => n.id === activeId) ?? null;

  // Esc closes the pop-up; lock page scroll while it is open.
  useEffect(() => {
    if (!active) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  return (
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
            <li key={n.id}>
              <button
                type="button"
                onClick={() => setActiveId(n.id)}
                className="group w-full text-left border border-line rounded-lg p-5 bg-surface shadow-sm hover:border-sky-400/60 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-sky-400/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-medium text-lg text-heading group-hover:text-sky-500 transition-colors">{n.title}</h3>
                  <time className="text-xs text-ink/50 whitespace-nowrap mt-1">{n.date}</time>
                </div>
                <p className="text-ink/70 mt-2 leading-relaxed whitespace-pre-line line-clamp-2">{n.content}</p>
                <span className="inline-block mt-3 text-sm font-medium text-sky-500">{t("notices.readMore")} →</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setActiveId(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setActiveId(null)}
              aria-label={t("gallery.close")}
              className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full text-ink/60 hover:bg-ink/10 hover:text-heading transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <time className="block text-xs text-ink/50 mb-2">{active.date}</time>
            <h2 id="notice-title" className="font-display text-2xl text-heading pr-8 mb-4 break-words">
              {active.title}
            </h2>
            <p className="text-ink/80 leading-relaxed whitespace-pre-wrap break-words">{active.content}</p>

            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="mt-6 rounded-lg border border-line px-5 py-2 text-sm font-medium text-ink hover:bg-ink/5 transition-colors"
            >
              {t("gallery.close")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
