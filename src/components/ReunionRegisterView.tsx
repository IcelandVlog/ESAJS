"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type ReunionInfo = {
  occasion: string;
  venue: string;
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

function GradientHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center mb-6">
      <h2 className="font-display text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-brand-blue to-brand-pink bg-clip-text text-transparent">
        {children}
      </h2>
      <div className="h-1 w-28 mx-auto mt-2 rounded-full bg-gradient-to-r from-brand-blue to-brand-pink" />
    </div>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white/90">
      <span className="shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg">{icon}</span>
      <span className="text-sm sm:text-base">{children}</span>
    </div>
  );
}

export default function ReunionRegisterView({ name }: { name: string }) {
  const { t, lang } = useLanguage();
  const [reunion, setReunion] = useState<ReunionInfo | null>(null);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/reunion-register")
      .then((res) => res.json())
      .then((data) => {
        setReunion(data.reunion ?? null);
        setRegistered(!!data.registered);
      })
      .finally(() => setLoading(false));
  }, []);

  const countdown = useCountdown(reunion?.reunionDate ?? null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!tokenInput.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/reunion-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: tokenInput.trim() }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || t("admin.error"));
      return;
    }
    setReunion(data.reunion ?? reunion);
    setRegistered(true);
    setTokenInput("");
  }

  const dateStr = reunion
    ? new Date(reunion.reunionDate).toLocaleString(lang === "bn" ? "bn-BD" : "en-US", {
        dateStyle: "full",
        timeStyle: "short",
      })
    : "";

  return (
    <>
      <DashboardHeader role="student" name={name} />
      <main className="flex-1 bg-paper py-10 px-4 sm:px-6">
        <div className="max-w-lg mx-auto">
          <h1 className="font-display text-xl text-heading mb-6 text-center">{t("reunionPage.title")}</h1>

          {loading ? (
            <p className="text-center text-ink/50">{t("reunionPage.loading")}</p>
          ) : !reunion ? (
            <p className="text-center text-ink/60 bg-surface border border-line rounded-lg p-6">
              {t("reunionPage.noReunion")}
            </p>
          ) : (
            <>
              {/* Dark gradient reunion card */}
              <div className="rounded-2xl p-6 sm:p-8 mb-6 shadow-xl bg-gradient-to-br from-navy-950 via-[#1b1035] to-navy-950">
                <GradientHeading>{t("reunionPage.cardTitle")}</GradientHeading>

                <div className="space-y-3">
                  <InfoRow icon="📅">
                    {t("reunionPage.dateLabel")}: {dateStr}
                  </InfoRow>
                  {reunion.venue && <InfoRow icon="📍">{t("reunionPage.venueLabel")}: {reunion.venue}</InfoRow>}
                </div>

                {countdown && (
                  <div className="mt-6">
                    {countdown.started ? (
                      <GradientHeading>{t("reunionPage.started")}</GradientHeading>
                    ) : (
                      <div className="flex items-center justify-center gap-3 sm:gap-5">
                        {[
                          [countdown.days, t("home.reunion.days")],
                          [countdown.hours, t("home.reunion.hours")],
                          [countdown.minutes, t("home.reunion.minutes")],
                          [countdown.seconds, t("home.reunion.seconds")],
                        ].map(([value, label], i) => (
                          <div key={i} className="flex flex-col items-center min-w-[52px]">
                            <span className="font-display text-xl sm:text-2xl text-white tabular-nums">
                              {String(value).padStart(2, "0")}
                            </span>
                            <span className="text-[11px] text-white/50 mt-1">{label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Registration */}
              {registered ? (
                <div className="bg-pine/10 border border-pine/20 text-heading rounded-lg p-5 text-center">
                  <p className="text-2xl mb-1">✅</p>
                  <p className="font-medium">{t("reunionPage.registeredMessage")}</p>
                </div>
              ) : (
                <form onSubmit={submit} className="bg-surface border border-line rounded-lg p-5">
                  <label className="block text-sm text-ink/70 mb-1.5">{t("reunionPage.tokenLabel")}</label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      required
                      type="text"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder={t("reunionPage.tokenPlaceholder")}
                      className="flex-1 min-w-[160px] border border-line rounded px-3 py-2.5 font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-pine/40"
                    />
                    <button
                      disabled={submitting}
                      className="bg-pine text-on-navy px-5 py-2.5 rounded text-sm hover:bg-pine-dark disabled:opacity-60"
                    >
                      {submitting ? t("reunionPage.submitting") : t("reunionPage.submit")}
                    </button>
                  </div>
                  {error && <p className="text-clay text-sm mt-3">{error}</p>}
                  <p className="text-xs text-ink/40 mt-3">{t("reunionPage.tokenHint")}</p>
                </form>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
