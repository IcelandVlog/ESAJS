import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/db/client";
import { students, results, attendance } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const session = await getSession();
  if (!session || session.role !== "student") {
    redirect("/login");
  }

  const [student] = await db.select().from(students).where(eq(students.id, session.id));
  if (!student) redirect("/login");

  const myResults = await db
    .select()
    .from(results)
    .where(eq(results.studentId, session.id))
    .orderBy(desc(results.id));

  const myAttendance = await db
    .select()
    .from(attendance)
    .where(eq(attendance.studentId, session.id))
    .orderBy(desc(attendance.date));

  const presentCount = myAttendance.filter((a) => a.status === "present").length;
  const attendanceRate = myAttendance.length ? Math.round((presentCount / myAttendance.length) * 100) : null;

  // group results by exam
  const examGroups = new Map<string, typeof myResults>();
  for (const r of myResults) {
    if (!examGroups.has(r.examName)) examGroups.set(r.examName, []);
    examGroups.get(r.examName)!.push(r);
  }

  return (
    <>
      <DashboardHeader title="শিক্ষার্থী ড্যাশবোর্ড" name={student.name} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-10">
        <section className="bg-white border border-line rounded-lg p-6 grid sm:grid-cols-4 gap-6">
          <Info label="নাম" value={student.name} />
          <Info label="রোল" value={student.roll} />
          <Info label="শ্রেণি" value={`${student.className} ${student.section}`} />
          <Info label="উপস্থিতির হার" value={attendanceRate !== null ? `${attendanceRate}%` : "তথ্য নেই"} />
        </section>

        <section>
          <h2 className="font-display text-2xl text-pine-dark mb-4 border-b border-line pb-3">রেজাল্ট</h2>
          {examGroups.size === 0 ? (
            <p className="text-ink/60">এখনো কোনো রেজাল্ট যুক্ত করা হয়নি।</p>
          ) : (
            <div className="space-y-6">
              {Array.from(examGroups.entries()).map(([exam, rows]) => (
                <div key={exam} className="bg-white border border-line rounded-lg overflow-hidden">
                  <div className="bg-pine/5 px-5 py-3 font-medium text-pine-dark">{exam}</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-ink/50 border-b border-line">
                        <th className="px-5 py-2 font-normal">বিষয়</th>
                        <th className="px-5 py-2 font-normal">প্রাপ্ত নম্বর</th>
                        <th className="px-5 py-2 font-normal">পূর্ণমান</th>
                        <th className="px-5 py-2 font-normal">গ্রেড</th>
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
          <h2 className="font-display text-2xl text-pine-dark mb-4 border-b border-line pb-3">অ্যাটেনডেন্স</h2>
          {myAttendance.length === 0 ? (
            <p className="text-ink/60">এখনো কোনো অ্যাটেনডেন্স রেকর্ড নেই।</p>
          ) : (
            <div className="bg-white border border-line rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink/50 border-b border-line">
                    <th className="px-5 py-2 font-normal">তারিখ</th>
                    <th className="px-5 py-2 font-normal">অবস্থা</th>
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
      <p className="font-medium text-pine-dark">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    present: { label: "উপস্থিত", cls: "bg-pine/10 text-pine-dark" },
    absent: { label: "অনুপস্থিত", cls: "bg-clay/10 text-clay" },
    late: { label: "দেরি", cls: "bg-gold/15 text-gold" },
  };
  const s = map[status] || { label: status, cls: "bg-ink/10 text-ink" };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>{s.label}</span>;
}
