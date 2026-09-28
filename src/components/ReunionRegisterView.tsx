"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type ReunionInfo = {
  occasion: string;
  venue: string;
  reunionDate: string;
  feeAmount: number;
};

type PaymentInfo = {
  paymentStatus: string; // "unpaid" | "pending" | "paid"
  paymentMethod: string;
  transactionId: string;
  amountPaid: number;
};

type PaymentOptions = {
  offlineNumbers: { bkash: string; nagad: string; rocket: string };
  payeeName: string;
};

type OfflineMethod = "bkash" | "nagad" | "rocket";
// Brand-coloured badges (text wordmarks, not the official logo artwork).
const OFFLINE_BRANDS: Record<OfflineMethod, { bg: string; mark: string }> = {
  bkash: { bg: "#E2136E", mark: "bKash" },
  nagad: { bg: "linear-gradient(135deg,#F6921E,#ED1C24)", mark: "Nagad" },
  rocket: { bg: "#8C3494", mark: "Rocket" },
};
const OFFLINE_LABELS: Record<OfflineMethod, string> = { bkash: "bKash", nagad: "Nagad", rocket: "Rocket" };
const OFFLINE_USSD: Record<OfflineMethod, string> = { bkash: "*247#", nagad: "*167#", rocket: "*322#" };

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

  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptions | null>(null);
  const [offlineMethod, setOfflineMethod] = useState<OfflineMethod | "">("");
  const [cashSelected, setCashSelected] = useState(false);
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [payError, setPayError] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [copiedField, setCopiedField] = useState<"number" | "amount" | null>(null);

  async function copyText(text: string, field: "number" | "amount") {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // Clipboard API can fail (permissions/older browsers) — the number/amount is
      // still shown on screen, so the student can just select & copy it manually.
    }
  }

  function loadStatus() {
    fetch("/api/reunion-register")
      .then((res) => res.json())
      .then((data) => {
        setReunion(data.reunion ?? null);
        setRegistered(!!data.registered);
        setPayment(data.payment ?? null);
        setPaymentOptions(data.paymentOptions ?? null);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function submitOffline(e: React.FormEvent) {
    e.preventDefault();
    setPayError("");
    if (!offlineMethod || !senderNumber.trim() || !trxId.trim()) return;
    setPayBusy(true);
    const res = await fetch("/api/reunion-payment/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: offlineMethod, senderNumber: senderNumber.trim(), transactionId: trxId.trim() }),
    });
    const data = await res.json();
    setPayBusy(false);
    if (!res.ok) {
      setPayError(data.error || t("admin.error"));
      return;
    }
    setPayment(data.payment);
    setSenderNumber("");
    setTrxId("");
    setOfflineMethod("");
  }

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
    setPayment(data.payment ?? null);
    setPaymentOptions(data.paymentOptions ?? null);
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
              {/* Tell the student first: a join code was sent to their Gmail. */}
              {!registered && (
                <div className="mb-6 rounded-xl border border-sky-500/30 bg-sky-500/10 p-5 text-center">
                  <p className="text-3xl mb-2">📧</p>
                  <p className="font-medium text-heading mb-1">{t("reunionPage.codeSentTitle")}</p>
                  <p className="text-sm text-ink/70 leading-relaxed">{t("reunionPage.codeSentBody")}</p>
                  <p className="text-xs text-ink/50 mt-2">{t("reunionPage.codeSentHint")}</p>
                </div>
              )}

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
                <>
                  <div className="bg-pine/10 border border-pine/20 text-heading rounded-lg p-5 text-center mb-6">
                    <p className="text-2xl mb-1">✅</p>
                    <p className="font-medium">{t("reunionPage.registeredMessage")}</p>
                  </div>

                  {reunion.feeAmount > 0 && (
                    <div className="bg-surface border border-line rounded-lg p-5">
                      <h3 className="font-display text-lg text-heading mb-3">{t("reunionPage.fee.title")}</h3>
                      <p className="text-sm text-ink/70 mb-4">
                        {t("reunionPage.fee.amountLabel")}: ৳{reunion.feeAmount}
                      </p>

                      {payment?.paymentStatus === "paid" ? (
                        <p className="text-pine font-medium">{t("reunionPage.fee.paid")}</p>
                      ) : payment?.paymentStatus === "pending" ? (
                        <p className="text-sm text-ink/70">
                          {t("reunionPage.fee.pending").replace("{trxId}", payment.transactionId)}
                        </p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <p className="text-sm text-ink/70">{t("reunionPage.fee.chooseMethod")}</p>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="radiogroup">
                            {(Object.keys(OFFLINE_BRANDS) as OfflineMethod[])
                              .filter((m) => paymentOptions?.offlineNumbers[m])
                              .map((m) => {
                                const brand = OFFLINE_BRANDS[m];
                                const active = offlineMethod === m;
                                return (
                                  <button
                                    key={m}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    aria-label={OFFLINE_LABELS[m]}
                                    onClick={() => {
                                      setOfflineMethod(m);
                                      setCashSelected(false);
                                    }}
                                    className={`rounded-lg border-2 p-2 flex flex-col items-center gap-1.5 transition ${
                                      active ? "border-pine bg-pine/10" : "border-line hover:border-pine/50"
                                    }`}
                                  >
                                    <span
                                      className="w-full h-11 rounded-md flex items-center justify-center text-white font-bold text-base tracking-wide"
                                      style={{ background: brand.bg }}
                                    >
                                      {brand.mark}
                                    </span>
                                    <span className="text-xs text-heading">{OFFLINE_LABELS[m]}</span>
                                  </button>
                                );
                              })}

                            <button
                              type="button"
                              role="radio"
                              aria-checked={cashSelected}
                              onClick={() => {
                                setCashSelected(true);
                                setOfflineMethod("");
                              }}
                              className={`rounded-lg border-2 p-2 flex flex-col items-center gap-1.5 transition ${
                                cashSelected ? "border-pine bg-pine/10" : "border-line hover:border-pine/50"
                              }`}
                            >
                              <span
                                className="w-full h-11 rounded-md flex items-center justify-center text-white font-bold text-base tracking-wide"
                                style={{ background: "#0f766e" }}
                              >
                                Cash
                              </span>
                              <span className="text-xs text-heading">{t("reunionPage.fee.cashLabel")}</span>
                            </button>
                          </div>

                          {cashSelected && (
                            <div className="bg-line/20 rounded px-3 py-3">
                              <p className="text-sm font-medium text-heading mb-1">{t("reunionPage.fee.cashTitle")}</p>
                              <p className="text-xs text-ink/60">
                                {t("reunionPage.fee.cashHint").replace("{amount}", String(reunion.feeAmount))}
                              </p>
                            </div>
                          )}

                          {offlineMethod && paymentOptions && (
                            <form onSubmit={submitOffline} className="flex flex-col gap-3">
                              <div className="bg-line/20 rounded px-3 py-3 flex flex-col gap-2">
                                <p className="text-sm">
                                  {t("reunionPage.fee.sendTo").replace("{amount}", String(reunion.feeAmount))}:{" "}
                                  <span className="font-mono font-medium">{paymentOptions.offlineNumbers[offlineMethod]}</span>
                                  {paymentOptions.payeeName ? ` (${paymentOptions.payeeName})` : ""}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <a
                                    href={`tel:${encodeURIComponent(OFFLINE_USSD[offlineMethod])}`}
                                    className="border border-pine/40 text-heading px-3 py-1.5 rounded text-xs hover:bg-pine/10"
                                  >
                                    📞 {t("reunionPage.fee.dialUssd").replace("{code}", OFFLINE_USSD[offlineMethod])}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => copyText(paymentOptions.offlineNumbers[offlineMethod], "number")}
                                    className="border border-line px-3 py-1.5 rounded text-xs hover:bg-line/30"
                                  >
                                    {copiedField === "number" ? t("reunionPage.fee.copied") : t("reunionPage.fee.copyNumber")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => copyText(String(reunion.feeAmount), "amount")}
                                    className="border border-line px-3 py-1.5 rounded text-xs hover:bg-line/30"
                                  >
                                    {copiedField === "amount" ? t("reunionPage.fee.copied") : t("reunionPage.fee.copyAmount")}
                                  </button>
                                </div>
                                <p className="text-xs text-ink/50">{t("reunionPage.fee.ussdHint")}</p>
                              </div>

                              <div>
                                <label className="block text-xs text-ink/60 mb-1">
                                  {t("reunionPage.fee.senderNumberLabel")}
                                </label>
                                <input
                                  required
                                  type="text"
                                  value={senderNumber}
                                  onChange={(e) => setSenderNumber(e.target.value)}
                                  placeholder={t("reunionPage.fee.senderNumberPlaceholder")}
                                  className="w-full border border-line rounded px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-ink/60 mb-1">{t("reunionPage.fee.trxIdLabel")}</label>
                                <input
                                  required
                                  type="text"
                                  value={trxId}
                                  onChange={(e) => setTrxId(e.target.value)}
                                  placeholder={t("reunionPage.fee.trxIdPlaceholder")}
                                  className="w-full border border-line rounded px-3 py-2 text-sm font-mono uppercase"
                                />
                              </div>
                              <button
                                disabled={payBusy}
                                className="border border-pine/40 text-heading px-5 py-2 rounded text-sm hover:bg-pine/10 disabled:opacity-60 self-start"
                              >
                                {payBusy ? t("reunionPage.fee.submitting") : t("reunionPage.fee.submit")}
                              </button>
                            </form>
                          )}

                          {payError && <p className="text-clay text-sm">{payError}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </>
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
