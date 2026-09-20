"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { AuthSelect } from "@/components/AuthField";
import { IconCalendar } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// The draft JWT is *signed*, not encrypted — decoding the payload here is only
// for showing "hi, is this you?" in the UI. The server independently verifies
// the signature when the form is submitted, so nothing here needs to be trusted.
function decodeDraftForDisplay(token: string): { name: string; email: string; picture: string | null } | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json);
    return { name: data.name, email: data.email, picture: data.picture ?? null };
  } catch {
    return null;
  }
}

export default function OAuthCompleteView({ draft }: { draft: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const profile = useMemo(() => (draft ? decodeDraftForDisplay(draft) : null), [draft]);

  const currentYear = new Date().getFullYear();
  const batchYears = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= 1960; y--) years.push(y);
    return years;
  }, [currentYear]);

  const [batch, setBatch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/oauth/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft, batch }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || t("login.error"));
      return;
    }
    setDone(true);
  }

  if (!draft || !profile) {
    return (
      <AuthShell title={t("register.title")}>
        <div className="text-center space-y-4">
          <p className="text-clay text-sm">{t("oauth.expired")}</p>
          <Link href="/login" className="text-heading font-medium hover:underline text-sm">
            {t("forgotPassword.backToLogin")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title={t("register.title")}>
        <div className="text-center space-y-4">
          <p className="text-heading font-medium">{t("register.title")} ✓</p>
          <p className="text-ink/70 text-sm">{t("register.pendingNotice")}</p>
          <Link
            href="/login"
            className="inline-block rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-sky-400 to-cyan-400 hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/25"
          >
            {t("register.loginLink")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("oauth.completeTitle")} subtitle={t("oauth.completeSubtitle")}>
      <div className="flex items-center gap-3 mb-5 bg-black/20 border border-line rounded-lg p-3">
        {profile.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.picture} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-line/40" />
        )}
        <div className="min-w-0">
          <p className="font-medium text-heading truncate">{profile.name}</p>
          <p className="text-xs text-ink/50 truncate">{profile.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthSelect icon={<IconCalendar />} label={t("register.batch")} value={batch} onChange={setBatch} required>
          <option value="">{t("register.batch")}</option>
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
          {loading ? t("register.submitting") : t("oauth.finish")}
        </button>
      </form>
    </AuthShell>
  );
}
