"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LangToggle() {
  const { lang, setLang } = useLanguage();

  const base = "px-2.5 py-1.5 transition-colors";
  const active = "bg-navy-900 text-white dark:bg-white dark:text-navy-900";
  const idle = "text-navy-900/60 dark:text-white/70 hover:text-navy-900 dark:hover:text-white";

  return (
    <div className="flex items-center rounded-full border border-navy-900/20 dark:border-white/25 text-xs font-medium overflow-hidden">
      <button type="button" onClick={() => setLang("bn")} className={`${base} ${lang === "bn" ? active : idle}`}>
        বাং
      </button>
      <button type="button" onClick={() => setLang("en")} className={`${base} ${lang === "en" ? active : idle}`}>
        EN
      </button>
    </div>
  );
}
