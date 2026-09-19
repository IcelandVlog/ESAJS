"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { AuthInput, AuthSelect } from "@/components/AuthField";
import { IconMail, IconCalendar, IconLock } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ForgotPasswordView() {
  const router = useRouter();
  const { t } = useLanguage();

  const [step, setStep] = useState<"request" | "reset">("request");
  const [roll, setRoll] = useState("");
  const [batch, setBatch] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [maskedContact, setMaskedContact] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const batchYears = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= 1960; y--) years.push(y);
    return years;
  }, [currentYear]);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roll, batch }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || t("login.error"));
      return;
    }
    setMaskedContact(data.maskedContact || "");
    setStep("reset");
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError(t("forgotPassword.mismatch"));
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roll, batch, code, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || t("login.error"));
      return;
    }
    setSuccess(t("forgotPassword.success"));
  }

  if (success) {
    return (
      <AuthShell title={t("forgotPassword.title")}>
        <div className="text-center space-y-5">
          <p className="text-2xl">✅</p>
          <p className="text-ink/80">{success}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full rounded-xl py-3 font-bold text-white bg-gradient-to-r from-sky-400 to-cyan-400 hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/25"
          >
            {t("forgotPassword.backToLogin")}
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("forgotPassword.title")}
      subtitle={step === "request" ? t("forgotPassword.subtitle") : undefined}
      footer={
        <p className="text-sm text-ink/60 text-center">
          <Link href="/login" className="text-heading font-medium hover:underline">
            {t("forgotPassword.backToLogin")}
          </Link>
        </p>
      }
    >
      {step === "request" ? (
        <form onSubmit={requestCode} className="space-y-4">
          <AuthInput
            icon={<IconMail />}
            label={t("login.roll")}
            value={roll}
            onChange={setRoll}
            required
            placeholder={t("login.roll")}
          />
          <AuthSelect icon={<IconCalendar />} label={t("login.batch")} value={batch} onChange={setBatch} required>
            <option value="">{t("login.batch")}</option>
            {batchYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </AuthSelect>

          {error && <p className="text-clay text-sm bg-clay/10 border border-clay/20 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 font-bold text-white bg-gradient-to-r from-sky-400 to-cyan-400 hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/25 disabled:opacity-60"
          >
            {loading ? t("forgotPassword.sending") : t("forgotPassword.sendCode")}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-4">
          <p className="text-sm text-ink/60 -mt-1">{t("forgotPassword.codeSentTo").replace("{contact}", maskedContact)}</p>

          <AuthInput
            icon={<IconLock />}
            label={t("forgotPassword.codeLabel")}
            value={code}
            onChange={setCode}
            required
            placeholder={t("forgotPassword.codePlaceholder")}
          />
          <PasswordInput
            value={newPassword}
            onChange={setNewPassword}
            required
            label={t("forgotPassword.newPassword")}
            placeholder={t("forgotPassword.newPassword")}
          />
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            label={t("forgotPassword.confirmPassword")}
            placeholder={t("forgotPassword.confirmPassword")}
          />

          {error && <p className="text-clay text-sm bg-clay/10 border border-clay/20 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 font-bold text-white bg-gradient-to-r from-sky-400 to-cyan-400 hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/25 disabled:opacity-60"
          >
            {loading ? t("forgotPassword.resetting") : t("forgotPassword.resetButton")}
          </button>

          <button
            type="button"
            onClick={() => setStep("request")}
            className="w-full text-center text-xs text-ink/50 hover:text-heading transition-colors"
          >
            {t("forgotPassword.resendCode")}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
