"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { BLOOD_GROUPS, FIRST_BATCH_YEAR, NON_STUDENT_BATCH } from "@/lib/validation";

export type StudentDetails = {
  name: string;
  email: string;
  phone: string;
  batch: string;
  dateOfBirth: string;
  bloodGroup: string;
  fatherName: string;
  motherName: string;
  address: string;
};

const inputClass =
  "w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40";

export default function StudentView({ initialDetails }: { initialDetails: StudentDetails }) {
  const { t } = useLanguage();
  const [saved, setSaved] = useState<StudentDetails>(initialDetails);
  const [form, setForm] = useState<StudentDetails>(initialDetails);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const batchYears = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: current - FIRST_BATCH_YEAR + 1 }, (_, i) => current - i);
  }, []);

  // People who registered as "not a student of this school" keep that batch;
  // they can't switch themselves into a real batch year (and vice versa).
  const isNonStudent = saved.batch === NON_STUDENT_BATCH;

  function set<K extends keyof StudentDetails>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSuccess(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      const res = await fetch("/api/me/details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("admin.error"));
        return;
      }
      setSaved(data.details);
      setForm(data.details);
      setSuccess(true);
    } catch {
      setError(t("admin.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DashboardHeader role="student" name={saved.name} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-10">
        <section className="bg-surface border border-line rounded-lg p-6">
          <h2 className="font-display text-xl text-heading">{t("student.detailsTitle")}</h2>
          <p className="text-sm text-ink/60 mt-1 mb-6">{t("student.detailsSubtitle")}</p>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("admin.field.name")}>
                <input required className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
              </Field>

              <Field label={t("register.email")} hint={t("student.emailNote")}>
                <input required type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>

              <Field label={t("student.mobile")} hint={t("student.mobileHint")}>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value.replace(/[^\d+]/g, ""))}
                  placeholder="01XXXXXXXXX"
                />
              </Field>

              <Field label={t("register.batch")}>
                <select required className={inputClass} value={form.batch} onChange={(e) => set("batch", e.target.value)}>
                  {isNonStudent ? (
                    <option value={NON_STUDENT_BATCH}>{t("register.batchOtherOption")}</option>
                  ) : (
                    batchYears.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))
                  )}
                </select>
              </Field>

              <Field label={t("admin.field.dob")}>
                <input type="date" className={inputClass} value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
              </Field>

              <Field label={t("admin.field.bloodGroup")}>
                <select className={inputClass} value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
                  <option value="">-</option>
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={t("admin.field.fatherName")}>
                <input className={inputClass} value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)} />
              </Field>

              <Field label={t("admin.field.motherName")}>
                <input className={inputClass} value={form.motherName} onChange={(e) => set("motherName", e.target.value)} />
              </Field>

            </div>

            <Field label={t("admin.field.address")}>
              <input className={inputClass} value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>

            {error && (
              <p className="text-clay text-sm bg-clay/10 border border-clay/20 rounded px-3 py-2">{error}</p>
            )}
            {success && (
              <p className="text-emerald-600 dark:text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/30 rounded px-3 py-2">
                {t("student.saved")}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-pine text-on-navy px-6 py-2.5 rounded text-sm hover:bg-pine-dark transition-colors disabled:opacity-60"
            >
              {saving ? t("admin.saving") : t("admin.save")}
            </button>
          </form>
        </section>

        <Link
          href="/reunion"
          className="block bg-gradient-to-r from-brand-blue to-brand-pink text-white rounded-lg p-5 text-center font-medium hover:opacity-90 transition-opacity"
        >
          🎉 {t("hero.reunionCard")}
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-ink/70 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-ink/50 mt-1">{hint}</p>}
    </div>
  );
}
