"use client";

import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { DictKey } from "@/lib/i18n/dictionaries";

type Student = {
  id: number;
  roll: string;
  name: string;
  className: string;
  section: string;
  fatherName: string;
  motherName: string;
  phone: string;
  address: string;
  batch: string | null;
  approved: boolean;
};

type Result = {
  id: number;
  studentId: number;
  examName: string;
  subject: string;
  marks: number;
  fullMarks: number;
  grade: string;
};

type Notice = {
  id: number;
  title: string;
  content: string;
  date: string;
};

type Attendance = {
  id: number;
  studentId: number;
  date: string;
  status: string;
};

const TABS = [
  { key: "students", labelKey: "admin.tab.students" },
  { key: "pending", labelKey: "admin.tab.pending" },
  { key: "results", labelKey: "admin.tab.results" },
  { key: "notices", labelKey: "admin.tab.notices" },
  { key: "attendance", labelKey: "admin.tab.attendance" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<TabKey>("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [sRes, rRes, nRes, aRes] = await Promise.all([
      fetch("/api/students").then((r) => r.json()),
      fetch("/api/results").then((r) => r.json()),
      fetch("/api/notices").then((r) => r.json()),
      fetch("/api/attendance").then((r) => r.json()),
    ]);
    setStudents(sRes.students || []);
    setResults(rRes.results || []);
    setNotices(nRes.notices || []);
    setAttendance(aRes.attendance || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const studentName = (id: number) => students.find((s) => s.id === id)?.name || `#${id}`;

  return (
    <div>
      <div className="flex gap-1 border-b border-line mb-8 flex-wrap">
        {TABS.map((tabItem) => {
          const pendingCount = students.filter((s) => !s.approved).length;
          return (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === tabItem.key ? "border-pine text-heading" : "border-transparent text-ink/50 hover:text-ink"
              }`}
            >
              {t(tabItem.labelKey as DictKey)}
              {tabItem.key === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center bg-clay text-white text-xs rounded-full w-5 h-5">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-ink/50">{t("admin.loading")}</p>
      ) : (
        <>
          {tab === "students" && (
            <StudentsTab students={students.filter((s) => s.approved)} onChange={loadAll} />
          )}
          {tab === "pending" && (
            <PendingTab students={students.filter((s) => !s.approved)} onChange={loadAll} />
          )}
          {tab === "results" && <ResultsTab results={results} students={students} studentName={studentName} onChange={loadAll} />}
          {tab === "notices" && <NoticesTab notices={notices} onChange={loadAll} />}
          {tab === "attendance" && (
            <AttendanceTab attendance={attendance} students={students} studentName={studentName} onChange={loadAll} />
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- Students ---------------- */
function StudentsTab({ students, onChange }: { students: Student[]; onChange: () => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const currentYear = new Date().getFullYear();
  const batchYears = Array.from({ length: currentYear - 1960 + 1 }, (_, i) => currentYear - i);
  const emptyForm = {
    roll: "",
    name: "",
    className: "",
    section: "",
    batch: "",
    fatherName: "",
    motherName: "",
    phone: "",
    address: "",
    password: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function startAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setOpen(true);
  }

  function startEdit(s: Student) {
    setForm({
      roll: s.roll,
      name: s.name,
      className: s.className,
      section: s.section,
      batch: s.batch || "",
      fatherName: s.fatherName,
      motherName: s.motherName,
      phone: s.phone,
      address: s.address,
      password: "",
    });
    setEditingId(s.id);
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch(editingId ? `/api/students/${editingId}` : "/api/students", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || t("admin.error"));
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    setOpen(false);
    onChange();
  }

  async function remove(id: number) {
    if (!confirm(t("admin.confirmDeleteStudent"))) return;
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl text-heading">
          {t("admin.studentList")} ({students.length})
        </h2>
        <button
          onClick={() => (open ? setOpen(false) : startAdd())}
          className="bg-pine text-paper text-sm px-4 py-2 rounded hover:bg-pine-dark transition-colors"
        >
          {open ? t("admin.cancel") : t("admin.addNewStudent")}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-surface border border-line rounded-lg p-5 mb-6 grid sm:grid-cols-2 gap-4">
          <Field label={t("admin.field.roll")} value={form.roll} onChange={(v) => setForm({ ...form, roll: v })} required />
          <Field label={t("admin.field.name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label={t("admin.field.class")} value={form.className} onChange={(v) => setForm({ ...form, className: v })} required placeholder="Class 9" />
          <Field label={t("admin.field.section")} value={form.section} onChange={(v) => setForm({ ...form, section: v })} placeholder="A" />
          <div>
            <label className="block text-sm text-ink/70 mb-1.5">{t("admin.field.batch")}</label>
            <select
              required
              value={form.batch}
              onChange={(e) => setForm({ ...form, batch: e.target.value })}
              className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
            >
              <option value="">{t("admin.selectPlaceholder")}</option>
              {batchYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <Field label={t("admin.field.fatherName")} value={form.fatherName} onChange={(v) => setForm({ ...form, fatherName: v })} />
          <Field label={t("admin.field.motherName")} value={form.motherName} onChange={(v) => setForm({ ...form, motherName: v })} />
          <Field label={t("admin.field.phone")} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label={t("admin.field.address")} value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          <Field
            label={editingId ? t("admin.leaveBlankToKeep") : t("admin.field.passwordForLogin")}
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            required={!editingId}
            type="password"
          />
          {error && <p className="sm:col-span-2 text-clay text-sm">{error}</p>}
          <div className="sm:col-span-2">
            <button disabled={saving} className="bg-pine text-paper px-5 py-2 rounded text-sm hover:bg-pine-dark disabled:opacity-60">
              {saving ? t("admin.saving") : t("admin.save")}
            </button>
          </div>
        </form>
      )}

      <div className="bg-surface border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-line">
              <th className="px-4 py-2.5 font-normal">{t("admin.field.roll")}</th>
              <th className="px-4 py-2.5 font-normal">{t("admin.field.name")}</th>
              <th className="px-4 py-2.5 font-normal">{t("admin.field.class")}</th>
              <th className="px-4 py-2.5 font-normal">{t("admin.field.batch")}</th>
              <th className="px-4 py-2.5 font-normal">{t("admin.field.phone")}</th>
              <th className="px-4 py-2.5 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">{s.roll}</td>
                <td className="px-4 py-2.5">{s.name}</td>
                <td className="px-4 py-2.5">{s.className} {s.section}</td>
                <td className="px-4 py-2.5">{s.batch || "-"}</td>
                <td className="px-4 py-2.5">{s.phone || "-"}</td>
                <td className="px-4 py-2.5 text-right space-x-3">
                  <button onClick={() => startEdit(s)} className="text-heading hover:underline text-xs font-medium">
                    {t("admin.edit")}
                  </button>
                  <button onClick={() => remove(s.id)} className="text-clay hover:underline text-xs">
                    {t("admin.delete")}
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/50">
                  {t("admin.noStudents")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Pending Registrations ---------------- */
function PendingTab({ students, onChange }: { students: Student[]; onChange: () => void }) {
  const { t } = useLanguage();
  const [busyId, setBusyId] = useState<number | null>(null);

  async function approve(id: number) {
    setBusyId(id);
    await fetch(`/api/students/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true }),
    });
    setBusyId(null);
    onChange();
  }

  async function reject(id: number) {
    if (!confirm(t("admin.confirmRejectRegistration"))) return;
    setBusyId(id);
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    setBusyId(null);
    onChange();
  }

  return (
    <div>
      <h2 className="font-display text-xl text-heading mb-4">
        {t("admin.pendingList")} ({students.length})
      </h2>
      <div className="bg-surface border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-line">
              <th className="px-4 py-2.5 font-normal">{t("admin.field.name")}</th>
              <th className="px-4 py-2.5 font-normal">{t("admin.field.batch")}</th>
              <th className="px-4 py-2.5 font-normal">{t("admin.field.contact")}</th>
              <th className="px-4 py-2.5 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">{s.name}</td>
                <td className="px-4 py-2.5">{s.batch || "-"}</td>
                <td className="px-4 py-2.5">{s.phone || s.roll}</td>
                <td className="px-4 py-2.5 text-right space-x-3">
                  <button
                    disabled={busyId === s.id}
                    onClick={() => approve(s.id)}
                    className="text-heading hover:underline text-xs font-medium disabled:opacity-50"
                  >
                    {t("admin.approve")}
                  </button>
                  <button
                    disabled={busyId === s.id}
                    onClick={() => reject(s.id)}
                    className="text-clay hover:underline text-xs disabled:opacity-50"
                  >
                    {t("admin.reject")}
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink/50">
                  {t("admin.noPending")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Results ---------------- */
function ResultsTab({
  results,
  students,
  studentName,
  onChange,
}: {
  results: Result[];
  students: Student[];
  studentName: (id: number) => string;
  onChange: () => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ studentId: "", examName: "", subject: "", marks: "", fullMarks: "100", grade: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || t("admin.error"));
      return;
    }
    setForm({ studentId: "", examName: "", subject: "", marks: "", fullMarks: "100", grade: "" });
    setOpen(false);
    onChange();
  }

  async function remove(id: number) {
    if (!confirm(t("admin.confirmDeleteResult"))) return;
    await fetch(`/api/results/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl text-heading">
          {t("admin.resultList")} ({results.length})
        </h2>
        <button
          onClick={() => setOpen((o) => !o)}
          className="bg-pine text-paper text-sm px-4 py-2 rounded hover:bg-pine-dark transition-colors"
        >
          {open ? t("admin.cancel") : t("admin.addNewResult")}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-surface border border-line rounded-lg p-5 mb-6 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-ink/70 mb-1.5">{t("admin.field.student")}</label>
            <select
              required
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
            >
              <option value="">{t("admin.selectPlaceholder")}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.roll} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <Field label={t("admin.field.examName")} value={form.examName} onChange={(v) => setForm({ ...form, examName: v })} required placeholder="Half Yearly 2026" />
          <Field label={t("admin.field.subject")} value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} required />
          <Field label={t("admin.field.marksObtained")} value={form.marks} onChange={(v) => setForm({ ...form, marks: v })} required type="number" />
          <Field label={t("admin.field.fullMarks")} value={form.fullMarks} onChange={(v) => setForm({ ...form, fullMarks: v })} type="number" />
          <Field label={t("admin.field.grade")} value={form.grade} onChange={(v) => setForm({ ...form, grade: v })} placeholder="A+" />
          {error && <p className="sm:col-span-2 text-clay text-sm">{error}</p>}
          <div className="sm:col-span-2">
            <button disabled={saving} className="bg-pine text-paper px-5 py-2 rounded text-sm hover:bg-pine-dark disabled:opacity-60">
              {saving ? t("admin.saving") : t("admin.save")}
            </button>
          </div>
        </form>
      )}

      <div className="bg-surface border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-line">
              <th className="px-4 py-2.5 font-normal">{t("admin.field.student")}</th>
              <th className="px-4 py-2.5 font-normal">{t("admin.col.exam")}</th>
              <th className="px-4 py-2.5 font-normal">{t("admin.field.subject")}</th>
              <th className="px-4 py-2.5 font-normal">{t("admin.field.marksObtained")}</th>
              <th className="px-4 py-2.5 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">{studentName(r.studentId)}</td>
                <td className="px-4 py-2.5">{r.examName}</td>
                <td className="px-4 py-2.5">{r.subject}</td>
                <td className="px-4 py-2.5">{r.marks}/{r.fullMarks}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => remove(r.id)} className="text-clay hover:underline text-xs">
                    {t("admin.delete")}
                  </button>
                </td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/50">
                  {t("admin.noResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Notices ---------------- */
function NoticesTab({ notices, onChange }: { notices: Notice[]; onChange: () => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", date: new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || t("admin.error"));
      return;
    }
    setForm({ title: "", content: "", date: new Date().toISOString().slice(0, 10) });
    setOpen(false);
    onChange();
  }

  async function remove(id: number) {
    if (!confirm(t("admin.confirmDeleteNotice"))) return;
    await fetch(`/api/notices/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl text-heading">
          {t("admin.noticeList")} ({notices.length})
        </h2>
        <button
          onClick={() => setOpen((o) => !o)}
          className="bg-pine text-paper text-sm px-4 py-2 rounded hover:bg-pine-dark transition-colors"
        >
          {open ? t("admin.cancel") : t("admin.addNewNotice")}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-surface border border-line rounded-lg p-5 mb-6 space-y-4">
          <Field label={t("admin.field.title")} value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <div>
            <label className="block text-sm text-ink/70 mb-1.5">{t("admin.field.content")}</label>
            <textarea
              required
              rows={4}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
            />
          </div>
          <Field label={t("admin.field.date")} value={form.date} onChange={(v) => setForm({ ...form, date: v })} type="date" required />
          {error && <p className="text-clay text-sm">{error}</p>}
          <button disabled={saving} className="bg-pine text-paper px-5 py-2 rounded text-sm hover:bg-pine-dark disabled:opacity-60">
            {saving ? t("admin.saving") : t("admin.save")}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {notices.map((n) => (
          <div key={n.id} className="bg-surface border border-line rounded-lg p-4 flex justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-heading">{n.title}</h3>
                <span className="text-xs text-ink/40">{n.date}</span>
              </div>
              <p className="text-sm text-ink/60 mt-1">{n.content}</p>
            </div>
            <button onClick={() => remove(n.id)} className="text-clay hover:underline text-xs shrink-0 h-fit">
              {t("admin.delete")}
            </button>
          </div>
        ))}
        {notices.length === 0 && <p className="text-ink/50 text-center py-6">{t("admin.noNotices")}</p>}
      </div>
    </div>
  );
}

/* ---------------- Attendance ---------------- */
function AttendanceTab({
  attendance,
  students,
  studentName,
  onChange,
}: {
  attendance: Attendance[];
  students: Student[];
  studentName: (id: number) => string;
  onChange: () => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ studentId: "", date: new Date().toISOString().slice(0, 10), status: "present" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || t("admin.error"));
      return;
    }
    setForm({ studentId: "", date: new Date().toISOString().slice(0, 10), status: "present" });
    setOpen(false);
    onChange();
  }

  async function remove(id: number) {
    await fetch(`/api/attendance/${id}`, { method: "DELETE" });
    onChange();
  }

  function statusLabel(status: string) {
    if (status === "present") return t("admin.status.present");
    if (status === "absent") return t("admin.status.absent");
    if (status === "late") return t("admin.status.late");
    return status;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl text-heading">
          {t("admin.attendanceList")} ({attendance.length})
        </h2>
        <button
          onClick={() => setOpen((o) => !o)}
          className="bg-pine text-paper text-sm px-4 py-2 rounded hover:bg-pine-dark transition-colors"
        >
          {open ? t("admin.cancel") : t("admin.addNewEntry")}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-surface border border-line rounded-lg p-5 mb-6 grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-ink/70 mb-1.5">{t("admin.field.student")}</label>
            <select
              required
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
            >
              <option value="">{t("admin.selectPlaceholder")}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.roll} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <Field label={t("admin.field.date")} value={form.date} onChange={(v) => setForm({ ...form, date: v })} type="date" required />
          <div>
            <label className="block text-sm text-ink/70 mb-1.5">{t("admin.field.status")}</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
            >
              <option value="present">{t("admin.status.present")}</option>
              <option value="absent">{t("admin.status.absent")}</option>
              <option value="late">{t("admin.status.late")}</option>
            </select>
          </div>
          {error && <p className="sm:col-span-3 text-clay text-sm">{error}</p>}
          <div className="sm:col-span-3">
            <button disabled={saving} className="bg-pine text-paper px-5 py-2 rounded text-sm hover:bg-pine-dark disabled:opacity-60">
              {saving ? t("admin.saving") : t("admin.save")}
            </button>
          </div>
        </form>
      )}

      <div className="bg-surface border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-line">
              <th className="px-4 py-2.5 font-normal">{t("admin.field.student")}</th>
              <th className="px-4 py-2.5 font-normal">{t("admin.field.date")}</th>
              <th className="px-4 py-2.5 font-normal">{t("admin.field.status")}</th>
              <th className="px-4 py-2.5 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {attendance.slice(0, 100).map((a) => (
              <tr key={a.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">{studentName(a.studentId)}</td>
                <td className="px-4 py-2.5">{a.date}</td>
                <td className="px-4 py-2.5">{statusLabel(a.status)}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => remove(a.id)} className="text-clay hover:underline text-xs">
                    {t("admin.delete")}
                  </button>
                </td>
              </tr>
            ))}
            {attendance.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink/50">
                  {t("admin.noEntries")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Shared ---------------- */
function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-ink/70 mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
      />
    </div>
  );
}
