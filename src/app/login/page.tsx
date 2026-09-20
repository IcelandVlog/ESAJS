"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { AuthInput, AuthSelect } from "@/components/AuthField";
import { IconUser, IconMail, IconCalendar } from "@/components/icons";
import SocialLoginButtons from "@/components/SocialLoginButtons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { DictKey } from "@/lib/i18n/dictionaries";

function oauthErrorKey(code: string): DictKey {
  if (code === "pending_approval") return "register.pendingNotice";
  if (code === "not_configured") return "oauth.errorNotConfigured";
  if (code === "facebook_no_email") return "oauth.errorNoEmail";
  return "oauth.errorGeneric";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [role, setRole] = useState<"admin" | "student">("student");
  const [identifier, setIdentifier] = useState("");
  const [batch, setBatch] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const batchYears = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= 1960; y--) years.push(y);
    return years;
  }, [currentYear]);

  useEffect(() => {
    if (searchParams.get("role") === "admin") setRole("admin");
    if (searchParams.get("role") === "student") setRole("student");
  }, [searchParams]);

  useEffect(() => {
    const oauthError = searchParams.get("oauthError");
    if (oauthError) setError(t(oauthErrorKey(oauthError)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, identifier, password, batch: role === "student" ? batch : undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("login.error"));
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError(t("login.error"));
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={role === "admin" ? t("adminLogin.title") : t("login.title")}
      subtitle={role === "admin" ? undefined : t("login.subtitle")}
      footer={
        <div className="space-y-4 text-center">
          {role === "student" && (
            <p className="text-sm text-ink/60">
              <Link href="/register" className="text-heading font-medium hover:underline">
                {t("login.newHere")}
              </Link>
            </p>
          )}
          <p className="text-xs text-ink/40">
            {role === "student" ? (
              <button onClick={() => setRole("admin")} className="hover:text-heading transition-colors">
                {t("adminLogin.link")}
              </button>
            ) : (
              <button onClick={() => setRole("student")} className="hover:text-heading transition-colors">
                {t("login.roleStudent")}
              </button>
            )}
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          icon={role === "student" ? <IconMail /> : <IconUser />}
          label={role === "student" ? t("login.roll") : t("login.username")}
          value={identifier}
          onChange={setIdentifier}
          required
          placeholder={role === "student" ? t("login.roll") : t("login.username")}
        />

        {role === "student" && (
          <AuthSelect
            icon={<IconCalendar />}
            label={t("login.batch")}
            value={batch}
            onChange={setBatch}
            required
          >
            <option value="">{t("login.batch")}</option>
            {batchYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </AuthSelect>
        )}

        <PasswordInput
          value={password}
          onChange={setPassword}
          required
          label={t("login.password")}
          placeholder={t("login.password")}
        />

        {role === "student" && (
          <div className="text-right -mt-2">
            <Link href="/forgot-password" className="text-xs text-ink/50 hover:text-heading transition-colors">
              {t("login.forgotPassword")}
            </Link>
          </div>
        )}

        {error && (
          <p className="text-clay text-sm bg-clay/10 border border-clay/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 font-bold text-white bg-gradient-to-r from-sky-400 to-cyan-400 hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/25 disabled:opacity-60"
        >
          {loading ? t("login.loading") : t("login.submit")}
        </button>
      </form>

      {role === "student" && <SocialLoginButtons />}
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
