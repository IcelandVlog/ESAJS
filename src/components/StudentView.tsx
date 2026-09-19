"use client";

import Link from "next/link";
import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Student = {
  name: string;
};

export default function StudentView({ student }: { student: Student }) {
  const { t } = useLanguage();

  return (
    <>
      <DashboardHeader role="student" name={student.name} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-10">
        <section className="bg-surface border border-line rounded-lg p-6">
          <Info label={t("student.name")} value={student.name} />
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink/50 mb-1">{label}</p>
      <p className="font-medium text-heading">{value}</p>
    </div>
  );
}
