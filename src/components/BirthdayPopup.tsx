"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Birthday = { id: number; name: string; photoUrl: string | null };

const CONFETTI = ["🎉", "🎈", "🎊", "✨", "🎂"];
const DISMISS_KEY_PREFIX = "esajs_birthday_dismissed_";

export default function BirthdayPopup() {
  const { t } = useLanguage();
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    fetch("/api/birthdays/today")
      .then((res) => res.json())
      .then((data: { birthdays?: Birthday[] }) => {
        const list = data.birthdays || [];
        if (list.length === 0) return;
        let dismissed = false;
        try {
          dismissed = localStorage.getItem(DISMISS_KEY_PREFIX + todayKey) === "1";
        } catch {
          dismissed = false;
        }
        if (dismissed) return;
        setBirthdays(list);
        setVisible(true);
      })
      .catch(() => {});
  }, []);

  function close() {
    setVisible(false);
    const todayKey = new Date().toISOString().slice(0, 10);
    try {
      localStorage.setItem(DISMISS_KEY_PREFIX + todayKey, "1");
    } catch {
      // ignore — worst case the popup reappears next page load today
    }
  }

  if (!visible || birthdays.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/60 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("birthday.title")}
      onClick={close}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-surface border border-line shadow-2xl overflow-hidden text-center"
        style={{ animation: "birthday-pop 0.35s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Falling confetti, purely decorative */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-lg select-none"
              style={{
                left: `${(i * 37) % 100}%`,
                top: "-24px",
                animation: `birthday-confetti-fall ${2 + (i % 4) * 0.4}s linear ${i * 0.15}s infinite`,
              }}
            >
              {CONFETTI[i % CONFETTI.length]}
            </span>
          ))}
        </div>

        <button
          onClick={close}
          aria-label={t("birthday.close")}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 dark:bg-white/10 text-ink/60 hover:text-ink transition-colors"
        >
          ✕
        </button>

        <div className="relative px-6 pt-10 pb-6 space-y-5">
          <p className="text-xs uppercase tracking-widest text-ink/50">{t("birthday.eyebrow")}</p>

          <div className="space-y-6">
            {birthdays.map((b) => (
              <div key={b.id} className="space-y-3">
                {b.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.photoUrl}
                    alt={b.name}
                    className="w-20 h-20 mx-auto rounded-full object-cover border-4 border-brand-pink/40 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 mx-auto rounded-full bg-line/40 flex items-center justify-center text-3xl">
                    🎂
                  </div>
                )}
                <p className="font-display text-lg text-heading">{b.name}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-gradient-to-r from-brand-blue to-brand-pink p-4 text-white">
            <p className="font-display text-2xl">🎂 {t("birthday.title")}</p>
          </div>

          <p className="text-sm text-ink/60 leading-relaxed">{t("birthday.wish")}</p>

          <button
            onClick={close}
            className="w-full rounded-xl py-3 font-bold text-white bg-gradient-to-r from-sky-400 to-cyan-400 hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/25"
          >
            {t("birthday.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
