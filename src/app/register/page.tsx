"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { AuthInput, AuthSelect } from "@/components/AuthField";
import { IconUser, IconMail, IconCalendar } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,}$/;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (container: HTMLElement, params: Record<string, unknown>) => number;
      getResponse: (id?: number) => string;
      reset: (id?: number) => void;
    };
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const batchYears = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= 1960; y--) years.push(y);
    return years;
  }, [currentYear]);

  const [name, setName] = useState("");
  const [batch, setBatch] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const recaptchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  // Once registration succeeds, briefly show the confirmation then send the
  // person back to the home page automatically.
  useEffect(() => {
    if (!done) return;
    const timeout = setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 2500);
    return () => clearTimeout(timeout);
  }, [done, router]);

  // In case the script tag is already loaded (e.g. client-side navigation back to this page),
  // Script's onLoad won't fire again — so also try rendering once grecaptcha shows up.
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    if (window.grecaptcha) {
      setRecaptchaReady(true);
      renderRecaptcha();
      return;
    }
    const interval = setInterval(() => {
      if (window.grecaptcha) {
        setRecaptchaReady(true);
        renderRecaptcha();
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderRecaptcha() {
    if (!RECAPTCHA_SITE_KEY || !recaptchaRef.current || widgetIdRef.current !== null) return;
    if (!window.grecaptcha) return;
    window.grecaptcha.ready(() => {
      if (!recaptchaRef.current || widgetIdRef.current !== null || !window.grecaptcha) return;
      widgetIdRef.current = window.grecaptcha.render(recaptchaRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
      });
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("register.passwordMismatch"));
      return;
    }
    if (!PASSWORD_RULE.test(password)) {
      setError(t("register.passwordHint"));
      return;
    }

    let recaptchaToken: string | undefined;
    if (RECAPTCHA_SITE_KEY) {
      recaptchaToken = window.grecaptcha?.getResponse(widgetIdRef.current ?? undefined);
      if (!recaptchaToken) {
        setError(t("register.captchaRequired"));
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, batch, contact, password, recaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("login.error"));
        setLoading(false);
        if (RECAPTCHA_SITE_KEY && widgetIdRef.current !== null) {
          window.grecaptcha?.reset(widgetIdRef.current);
        }
        return;
      }
      setDone(true);
    } catch {
      setError(t("login.error"));
      setLoading(false);
    }
  }

  return (
    <>
      {RECAPTCHA_SITE_KEY && (
        <Script
          src="https://www.google.com/recaptcha/api.js"
          strategy="afterInteractive"
          onLoad={() => {
            setRecaptchaReady(true);
            renderRecaptcha();
          }}
        />
      )}
      <AuthShell
        wide
        title={t("register.title")}
        subtitle={t("register.subtitle")}
        footer={
          !done && (
            <p className="text-center text-sm text-ink/60">
              {t("register.loginPrompt")}{" "}
              <Link href="/login" className="text-heading font-medium hover:underline">
                {t("register.loginLink")}
              </Link>
            </p>
          )
        }
      >
        {done ? (
          <div className="text-center space-y-4">
            <p className="text-heading font-medium">{t("register.title")} ✓</p>
            <p className="text-ink/70 text-sm">{t("register.pendingNotice")}</p>
            <p className="text-ink/40 text-xs">{t("register.redirecting")}</p>
            <Link
              href="/login"
              className="inline-block rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-sky-400 to-cyan-400 hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/25"
            >
              {t("register.loginLink")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              icon={<IconUser />}
              label={t("register.name")}
              value={name}
              onChange={setName}
              required
            />

            <AuthSelect
              icon={<IconCalendar />}
              label={t("register.batch")}
              value={batch}
              onChange={setBatch}
              required
            >
              <option value="">{t("register.batch")}</option>
              {batchYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </AuthSelect>

            <AuthInput
              icon={<IconMail />}
              label={t("register.contact")}
              value={contact}
              onChange={setContact}
              required
              placeholder={t("register.contact")}
            />

            <div>
              <PasswordInput
                required
                value={password}
                onChange={setPassword}
                label={t("register.password")}
                placeholder={t("register.password")}
              />
              <p className="text-xs text-ink/50 mt-1.5">{t("register.passwordHint")}</p>
            </div>

            <PasswordInput
              required
              value={confirmPassword}
              onChange={setConfirmPassword}
              label={t("register.confirmPassword")}
              placeholder={t("register.confirmPassword")}
            />

            {RECAPTCHA_SITE_KEY ? (
              <div ref={recaptchaRef} className={recaptchaReady ? "" : "opacity-50"} />
            ) : (
              <p className="text-xs text-ink/40 italic">reCAPTCHA not configured yet.</p>
            )}

            {error && (
              <p className="text-clay text-sm bg-clay/10 border border-clay/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 font-bold text-white bg-gradient-to-r from-sky-400 to-cyan-400 hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/25 disabled:opacity-60"
            >
              {loading ? t("register.submitting") : t("register.submit")}
            </button>
          </form>
        )}
      </AuthShell>
    </>
  );
}
