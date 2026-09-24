"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { ReunionToken } from "./ReunionTab";
import BirthdayPopup, { type Birthday } from "@/components/BirthdayPopup";

type StudentLite = {
  id: number;
  name: string;
  photoUrl?: string | null;
  batch: string | null;
  approved: boolean;
  bloodGroup: string | null;
  dateOfBirth: string | null;
};

type Props = {
  students: StudentLite[];
  tokens: ReunionToken[];
  noticeCount: number;
  galleryCount: number;
  /** Set for batch admins: they only see their own batch, so hide site-wide extras. */
  scopedBatch?: string | null;
};

const NON_STUDENT = "other";

function StatCard({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "good" | "warn" }) {
  const toneClass =
    tone === "good" ? "text-emerald-500" : tone === "warn" ? "text-clay" : "text-heading";
  return (
    <div className="bg-surface border border-line rounded-lg p-4">
      <p className="text-xs text-ink/50 mb-1.5">{label}</p>
      <p className={`font-display text-3xl ${toneClass}`}>{value}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-lg text-heading mb-3">{children}</h3>;
}

export default function DashboardTab({ students, tokens, noticeCount, galleryCount, scopedBatch = null }: Props) {
  const { t, lang } = useLanguage();
  const [attendees, setAttendees] = useState<Record<number, number>>({});
  // Birthday-wish test: which person(s) to preview, and a counter so each click replays the animation.
  const [bdChoice, setBdChoice] = useState("sample");
  const [bdPreview, setBdPreview] = useState<{ key: number; list: Birthday[] } | null>(null);

  useEffect(() => {
    fetch("/api/admin-stats")
      .then((r) => r.json())
      .then((d) => setAttendees(d.attendeesByToken || {}))
      .catch(() => setAttendees({}));
  }, [tokens.length]);

  const stats = useMemo(() => {
    const total = students.length;
    const approved = students.filter((s) => s.approved).length;
    const nonStudents = students.filter((s) => s.batch === NON_STUDENT).length;
    const schoolStudents = total - nonStudents;

    // Per-batch counts (real batch years, newest first; "no batch" last).
    const byBatch = new Map<string, { total: number; approved: number }>();
    for (const s of students) {
      if (s.batch === NON_STUDENT) continue;
      const key = s.batch || "";
      const row = byBatch.get(key) ?? { total: 0, approved: 0 };
      row.total += 1;
      if (s.approved) row.approved += 1;
      byBatch.set(key, row);
    }
    const batchRows = [...byBatch.entries()]
      .map(([batch, v]) => ({ batch, ...v }))
      .sort((a, b) => {
        if (!a.batch) return 1;
        if (!b.batch) return -1;
        return Number(b.batch) - Number(a.batch);
      });

    const bloodCounts = new Map<string, number>();
    for (const s of students) {
      if (!s.bloodGroup) continue;
      bloodCounts.set(s.bloodGroup, (bloodCounts.get(s.bloodGroup) ?? 0) + 1);
    }
    const bloodRows = [...bloodCounts.entries()].sort((a, b) => b[1] - a[1]);

    const thisMonth = new Date().getMonth() + 1;
    const birthdays = students.filter((s) => {
      const m = /^\d{4}-(\d{2})-\d{2}/.exec(s.dateOfBirth || "");
      return m ? Number(m[1]) === thisMonth : false;
    }).length;

    return { total, approved, pending: total - approved, nonStudents, schoolStudents, batchRows, bloodRows, birthdays };
  }, [students]);

  // Reunions: one "event" per (calendar day + occasion) among non-cancelled codes.
  const reunion = useMemo(() => {
    const now = Date.now();
    const statusOf = (tk: ReunionToken): "cancelled" | "held" | "upcoming" => {
      if (tk.cancelled) return "cancelled";
      if (tk.reunionDate && new Date(tk.reunionDate).getTime() < now) return "held";
      return "upcoming";
    };
    const eventKey = (tk: ReunionToken) => `${(tk.reunionDate || "").slice(0, 10)}|${tk.occasion}`;
    const held = new Set<string>();
    const upcoming = new Set<string>();
    const cancelled = new Set<string>();
    for (const tk of tokens) {
      const st = statusOf(tk);
      (st === "held" ? held : st === "upcoming" ? upcoming : cancelled).add(eventKey(tk));
    }
    const confirmed = tokens.filter((tk) => !tk.cancelled).reduce((sum, tk) => sum + (attendees[tk.id] ?? 0), 0);
    const rows = [...tokens]
      .sort((a, b) => new Date(b.reunionDate || 0).getTime() - new Date(a.reunionDate || 0).getTime())
      .map((tk) => ({ tk, status: statusOf(tk) }));
    return { held: held.size, upcoming: upcoming.size, cancelled: cancelled.size, confirmed, rows };
  }, [tokens, attendees]);

  // Same rule as the public popup: approved students whose birthday is today in Bangladesh.
  const todaysBirthdays = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    return students.filter((s) => {
      if (!s.approved || !s.dateOfBirth) return false;
      const p = s.dateOfBirth.split("-");
      return p.length === 3 && p[1] === month && p[2] === day;
    });
  }, [students]);

  function startBirthdayPreview() {
    let list: Birthday[];
    if (bdChoice === "sample") {
      list = [{ id: -1, name: t("dashboard.birthdaySampleName"), photoUrl: null }];
    } else if (bdChoice === "today") {
      list = todaysBirthdays.map((s) => ({ id: s.id, name: s.name, photoUrl: s.photoUrl ?? null }));
    } else {
      const s = students.find((x) => String(x.id) === bdChoice);
      list = s ? [{ id: s.id, name: s.name, photoUrl: s.photoUrl ?? null }] : [];
    }
    if (list.length === 0) return;
    setBdPreview((prev) => ({ key: (prev?.key ?? 0) + 1, list }));
  }

  const maxBatch = Math.max(1, ...stats.batchRows.map((r) => r.total));
  const maxBlood = Math.max(1, ...stats.bloodRows.map(([, c]) => c));
  const locale = lang === "bn" ? "bn-BD" : "en-GB";
  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "-");

  const statusLabel = {
    held: t("dashboard.status.held"),
    upcoming: t("dashboard.status.upcoming"),
    cancelled: t("dashboard.status.cancelled"),
  };
  const statusClass = {
    held: "bg-emerald-500/15 text-emerald-500",
    upcoming: "bg-sky-500/15 text-sky-500",
    cancelled: "bg-clay/15 text-clay",
  };

  return (
    <div className="space-y-10">
      {/* Registrations */}
      <section>
        <SectionTitle>{t("dashboard.registrations")}</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label={t("dashboard.totalRegistrations")} value={stats.total} />
          <StatCard label={t("dashboard.schoolStudents")} value={stats.schoolStudents} tone="good" />
          {!scopedBatch && <StatCard label={t("dashboard.nonStudents")} value={stats.nonStudents} />}
          <StatCard label={t("dashboard.approved")} value={stats.approved} tone="good" />
          <StatCard label={t("dashboard.pending")} value={stats.pending} tone={stats.pending > 0 ? "warn" : "default"} />
          <StatCard label={t("dashboard.birthdaysThisMonth")} value={stats.birthdays} />
        </div>
      </section>

      {/* Batch wise */}
      <section>
        <SectionTitle>{t("dashboard.batchWise")}</SectionTitle>
        <div className="bg-surface border border-line rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-ink/50 border-b border-line">
                <th className="px-4 py-2.5 font-normal">{t("admin.field.batch")}</th>
                <th className="px-4 py-2.5 font-normal">{t("dashboard.total")}</th>
                <th className="px-4 py-2.5 font-normal">{t("dashboard.approved")}</th>
                <th className="px-4 py-2.5 font-normal">{t("dashboard.pending")}</th>
                <th className="px-4 py-2.5 font-normal w-1/3"></th>
              </tr>
            </thead>
            <tbody>
              {stats.batchRows.map((r) => (
                <tr key={r.batch || "none"} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 font-medium">{r.batch || t("dashboard.noBatch")}</td>
                  <td className="px-4 py-2.5">{r.total}</td>
                  <td className="px-4 py-2.5">{r.approved}</td>
                  <td className="px-4 py-2.5">{r.total - r.approved}</td>
                  <td className="px-4 py-2.5">
                    <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-pink" style={{ width: `${(r.total / maxBatch) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
              {stats.nonStudents > 0 && (
                <tr className="border-t border-line bg-ink/[0.03]">
                  <td className="px-4 py-2.5 font-medium">{t("register.batchOtherShort")}</td>
                  <td className="px-4 py-2.5">{stats.nonStudents}</td>
                  <td className="px-4 py-2.5">{students.filter((s) => s.batch === NON_STUDENT && s.approved).length}</td>
                  <td className="px-4 py-2.5">{students.filter((s) => s.batch === NON_STUDENT && !s.approved).length}</td>
                  <td className="px-4 py-2.5" />
                </tr>
              )}
              {stats.batchRows.length === 0 && stats.nonStudents === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-ink/50">
                    {t("dashboard.noRegistrations")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reunions */}
      <section>
        <SectionTitle>{t("dashboard.reunions")}</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label={t("dashboard.reunionsHeld")} value={reunion.held} tone="good" />
          <StatCard label={t("dashboard.reunionsUpcoming")} value={reunion.upcoming} />
          <StatCard label={t("dashboard.reunionsCancelled")} value={reunion.cancelled} />
          <StatCard label={t("dashboard.attendeesConfirmed")} value={reunion.confirmed} tone="good" />
        </div>
        <div className="bg-surface border border-line rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-ink/50 border-b border-line">
                <th className="px-4 py-2.5 font-normal">{t("dashboard.col.occasion")}</th>
                <th className="px-4 py-2.5 font-normal">{t("reunion.col.batch")}</th>
                <th className="px-4 py-2.5 font-normal">{t("dashboard.col.date")}</th>
                <th className="px-4 py-2.5 font-normal">{t("dashboard.col.status")}</th>
                <th className="px-4 py-2.5 font-normal">{t("dashboard.col.invited")}</th>
                <th className="px-4 py-2.5 font-normal">{t("dashboard.col.confirmed")}</th>
              </tr>
            </thead>
            <tbody>
              {reunion.rows.map(({ tk, status }) => (
                <tr key={tk.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5">{tk.occasion || "-"}</td>
                  <td className="px-4 py-2.5">{tk.batch === NON_STUDENT ? t("register.batchOtherShort") : tk.batch}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(tk.reunionDate)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${statusClass[status]}`}>{statusLabel[status]}</span>
                  </td>
                  <td className="px-4 py-2.5">{tk.recipientCount}</td>
                  <td className="px-4 py-2.5">{attendees[tk.id] ?? 0}</td>
                </tr>
              ))}
              {reunion.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink/50">
                    {t("dashboard.noReunions")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Blood groups + site content */}
      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <SectionTitle>{t("admin.field.bloodGroup")}</SectionTitle>
          <div className="bg-surface border border-line rounded-lg p-4 space-y-2.5">
            {stats.bloodRows.map(([group, count]) => (
              <div key={group} className="flex items-center gap-3 text-sm">
                <span className="w-10 font-medium">{group}</span>
                <div className="flex-1 h-2 rounded-full bg-ink/10 overflow-hidden">
                  <div className="h-full rounded-full bg-clay" style={{ width: `${(count / maxBlood) * 100}%` }} />
                </div>
                <span className="w-8 text-right text-ink/70">{count}</span>
              </div>
            ))}
            {stats.bloodRows.length === 0 && <p className="text-sm text-ink/50 text-center py-2">{t("dashboard.noData")}</p>}
          </div>
        </div>
        {!scopedBatch && (
          <div>
            <SectionTitle>{t("dashboard.siteContent")}</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label={t("admin.tab.notices")} value={noticeCount} />
              <StatCard label={t("admin.tab.gallery")} value={galleryCount} />
            </div>
          </div>
        )}
      </section>

      {/* Birthday wish test */}
      <section>
        <SectionTitle>{t("dashboard.birthdayTest")}</SectionTitle>
        <div className="bg-surface border border-line rounded-lg p-5 space-y-4">
          <p className="text-sm text-ink/60">{t("dashboard.birthdayTestHint")}</p>
          <p className="text-sm">
            <span className="text-ink/50">{t("dashboard.birthdayToday")}: </span>
            {todaysBirthdays.length > 0 ? (
              <span className="font-medium">{todaysBirthdays.map((s) => s.name).join(", ")}</span>
            ) : (
              <span className="text-ink/60">{t("dashboard.birthdayNone")}</span>
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={bdChoice}
              onChange={(e) => setBdChoice(e.target.value)}
              className="flex-1 border border-line rounded px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-pine/40"
            >
              <option value="sample">{t("dashboard.birthdaySample")}</option>
              {todaysBirthdays.length > 0 && <option value="today">{t("dashboard.birthdayTodayAll")}</option>}
              <optgroup label={t("dashboard.birthdayPickStudent")}>
                {students.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <button
              type="button"
              onClick={startBirthdayPreview}
              className="bg-pine text-on-navy px-5 py-2.5 rounded text-sm hover:bg-pine-dark transition-colors whitespace-nowrap"
            >
              🎂 {t("dashboard.birthdayPreview")}
            </button>
          </div>
        </div>
      </section>

      {bdPreview && <BirthdayPopup key={bdPreview.key} preview={bdPreview.list} onClose={() => setBdPreview(null)} />}
    </div>
  );
}
