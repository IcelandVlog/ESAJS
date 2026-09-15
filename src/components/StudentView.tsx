"use client";

import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Student = {
  name: string;
  roll: string;
  className: string;
  section: string;
};

type Result = {
  id: number;
  examName: string;
  subject: string;
  marks: number;
  fullMarks: number;
  grade: string | null;
};

type Attendance = {
  id: number;
  date: string;
  status: string;
};

export default function StudentView({
  student,
  examGroups,
  myAttendance,
  attendanceRate,
}: {
  student: Student;
  examGroups: [string, Result[]][];
  myAttendance: Attendance[];
  attendanceRate: number | null;
}) {
  const { t } = useLanguage();

  return (
    <>
      <DashboardHeader role="student" name={student.name} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-10">
        <section className="bg-surface border border-line rounded-lg p-6 grid sm:grid-cols-4 gap-6">
          <Info label={t("student.name")} value={student.name} />
          <Info label={t("student.rollLabel")} value={student.roll} />
          <Info label={t("student.classLabel")} value={`${student.className} ${student.section}`} />
          <Info
            label={t("student.attendanceRate")}
            value={attendanceRate !== null ? `${attendanceRate}%` : t("student.noData")}
          />
        </section>

        <section>
          <h2 className="font-display text-2xl text-heading mb-4 border-b border-line pb-3">
            {t("student.myResults")}
          </h2>
          {examGroups.length === 0 ? (
            <p className="text-ink/60">{t("student.noResultsYet")}</p>
          ) : (
            <div className="space-y-6">
              {examGroups.map(([exam, rows]) => (
                <div key={exam} className="bg-surface border border-line rounded-lg overflow-hidden">
                  <div className="bg-pine/5 px-5 py-3 font-medium text-heading">{exam}</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-ink/50 border-b border-line">
                        <th className="px-5 py-2 font-normal">{t("student.table.subject")}</th>
                        <th className="px-5 py-2 font-normal">{t("student.table.marksObtained")}</th>
                        <th className="px-5 py-2 font-normal">{t("student.table.fullMarks")}</th>
                        <th className="px-5 py-2 font-normal">{t("student.table.grade")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="border-b border-line last:border-0">
                          <td className="px-5 py-2.5">{r.subject}</td>
                          <td className="px-5 py-2.5">{r.marks}</td>
                          <td className="px-5 py-2.5">{r.fullMarks}</td>
                          <td className="px-5 py-2.5">{r.grade || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-2xl text-heading mb-4 border-b border-line pb-3">
            {t("student.myAttendance")}
          </h2>
          {myAttendance.length === 0 ? (
            <p className="text-ink/60">{t("student.noAttendanceYet")}</p>
          ) : (
            <div className="bg-surface border border-line rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink/50 border-b border-line">
                    <th className="px-5 py-2 font-normal">{t("student.table.date")}</th>
                    <th className="px-5 py-2 font-normal">{t("student.table.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {myAttendance.slice(0, 30).map((a) => (
                    <tr key={a.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-2.5">{a.date}</td>
                      <td className="px-5 py-2.5">
                        <StatusBadge status={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
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

function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const map: Record<string, { key: "admin.status.present" | "admin.status.absent" | "admin.status.late"; cls: string }> = {
    present: { key: "admin.status.present", cls: "bg-pine/10 text-heading" },
    absent: { key: "admin.status.absent", cls: "bg-clay/10 text-clay" },
    late: { key: "admin.status.late", cls: "bg-gold/15 text-gold" },
  };
  const s = map[status];
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${s ? s.cls : "bg-ink/10 text-ink"}`}>
      {s ? t(s.key) : status}
    </span>
  );
}
