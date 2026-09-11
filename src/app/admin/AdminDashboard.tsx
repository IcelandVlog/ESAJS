"use client";

import { useEffect, useState, useCallback } from "react";

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
  { key: "students", label: "শিক্ষার্থী" },
  { key: "results", label: "রেজাল্ট" },
  { key: "notices", label: "নোটিশ" },
  { key: "attendance", label: "অ্যাটেনডেন্স" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminDashboard() {
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
      <div className="flex gap-1 border-b border-line mb-8">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-pine text-pine-dark" : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink/50">লোড হচ্ছে...</p>
      ) : (
        <>
          {tab === "students" && <StudentsTab students={students} onChange={loadAll} />}
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
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    roll: "",
    name: "",
    className: "",
    section: "",
    fatherName: "",
    motherName: "",
    phone: "",
    address: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "সমস্যা হয়েছে");
      return;
    }
    setForm({ roll: "", name: "", className: "", section: "", fatherName: "", motherName: "", phone: "", address: "", password: "" });
    setOpen(false);
    onChange();
  }

  async function remove(id: number) {
    if (!confirm("এই শিক্ষার্থীকে মুছে ফেলতে চান? এর সাথে সম্পর্কিত রেজাল্ট ও অ্যাটেনডেন্সও মুছে যাবে।")) return;
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl text-pine-dark">শিক্ষার্থী তালিকা ({students.length})</h2>
        <button
          onClick={() => setOpen((o) => !o)}
          className="bg-pine text-paper text-sm px-4 py-2 rounded hover:bg-pine-dark transition-colors"
        >
          {open ? "বাতিল" : "+ নতুন শিক্ষার্থী"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-white border border-line rounded-lg p-5 mb-6 grid sm:grid-cols-2 gap-4">
          <Field label="রোল" value={form.roll} onChange={(v) => setForm({ ...form, roll: v })} required />
          <Field label="নাম" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="শ্রেণি" value={form.className} onChange={(v) => setForm({ ...form, className: v })} required placeholder="Class 9" />
          <Field label="শাখা" value={form.section} onChange={(v) => setForm({ ...form, section: v })} placeholder="A" />
          <Field label="পিতার নাম" value={form.fatherName} onChange={(v) => setForm({ ...form, fatherName: v })} />
          <Field label="মাতার নাম" value={form.motherName} onChange={(v) => setForm({ ...form, motherName: v })} />
          <Field label="ফোন" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="ঠিকানা" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          <Field label="পাসওয়ার্ড (লগইনের জন্য)" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required type="password" />
          {error && <p className="sm:col-span-2 text-clay text-sm">{error}</p>}
          <div className="sm:col-span-2">
            <button disabled={saving} className="bg-pine text-paper px-5 py-2 rounded text-sm hover:bg-pine-dark disabled:opacity-60">
              {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-line">
              <th className="px-4 py-2.5 font-normal">রোল</th>
              <th className="px-4 py-2.5 font-normal">নাম</th>
              <th className="px-4 py-2.5 font-normal">শ্রেণি</th>
              <th className="px-4 py-2.5 font-normal">ফোন</th>
              <th className="px-4 py-2.5 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">{s.roll}</td>
                <td className="px-4 py-2.5">{s.name}</td>
                <td className="px-4 py-2.5">{s.className} {s.section}</td>
                <td className="px-4 py-2.5">{s.phone || "-"}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => remove(s.id)} className="text-clay hover:underline text-xs">
                    মুছুন
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/50">
                  কোনো শিক্ষার্থী যুক্ত করা হয়নি
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
      setError(data.error || "সমস্যা হয়েছে");
      return;
    }
    setForm({ studentId: "", examName: "", subject: "", marks: "", fullMarks: "100", grade: "" });
    setOpen(false);
    onChange();
  }

  async function remove(id: number) {
    if (!confirm("এই রেজাল্টটি মুছে ফেলতে চান?")) return;
    await fetch(`/api/results/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl text-pine-dark">রেজাল্ট তালিকা ({results.length})</h2>
        <button
          onClick={() => setOpen((o) => !o)}
          className="bg-pine text-paper text-sm px-4 py-2 rounded hover:bg-pine-dark transition-colors"
        >
          {open ? "বাতিল" : "+ নতুন রেজাল্ট"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-white border border-line rounded-lg p-5 mb-6 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-ink/70 mb-1.5">শিক্ষার্থী</label>
            <select
              required
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
            >
              <option value="">নির্বাচন করুন</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.roll} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <Field label="পরীক্ষার নাম" value={form.examName} onChange={(v) => setForm({ ...form, examName: v })} required placeholder="Half Yearly 2026" />
          <Field label="বিষয়" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} required />
          <Field label="প্রাপ্ত নম্বর" value={form.marks} onChange={(v) => setForm({ ...form, marks: v })} required type="number" />
          <Field label="পূর্ণমান" value={form.fullMarks} onChange={(v) => setForm({ ...form, fullMarks: v })} type="number" />
          <Field label="গ্রেড" value={form.grade} onChange={(v) => setForm({ ...form, grade: v })} placeholder="A+" />
          {error && <p className="sm:col-span-2 text-clay text-sm">{error}</p>}
          <div className="sm:col-span-2">
            <button disabled={saving} className="bg-pine text-paper px-5 py-2 rounded text-sm hover:bg-pine-dark disabled:opacity-60">
              {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-line">
              <th className="px-4 py-2.5 font-normal">শিক্ষার্থী</th>
              <th className="px-4 py-2.5 font-normal">পরীক্ষা</th>
              <th className="px-4 py-2.5 font-normal">বিষয়</th>
              <th className="px-4 py-2.5 font-normal">নম্বর</th>
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
                    মুছুন
                  </button>
                </td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/50">
                  কোনো রেজাল্ট যুক্ত করা হয়নি
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
      setError(data.error || "সমস্যা হয়েছে");
      return;
    }
    setForm({ title: "", content: "", date: new Date().toISOString().slice(0, 10) });
    setOpen(false);
    onChange();
  }

  async function remove(id: number) {
    if (!confirm("এই নোটিশটি মুছে ফেলতে চান?")) return;
    await fetch(`/api/notices/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl text-pine-dark">নোটিশ তালিকা ({notices.length})</h2>
        <button
          onClick={() => setOpen((o) => !o)}
          className="bg-pine text-paper text-sm px-4 py-2 rounded hover:bg-pine-dark transition-colors"
        >
          {open ? "বাতিল" : "+ নতুন নোটিশ"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-white border border-line rounded-lg p-5 mb-6 space-y-4">
          <Field label="শিরোনাম" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <div>
            <label className="block text-sm text-ink/70 mb-1.5">বিস্তারিত</label>
            <textarea
              required
              rows={4}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
            />
          </div>
          <Field label="তারিখ" value={form.date} onChange={(v) => setForm({ ...form, date: v })} type="date" required />
          {error && <p className="text-clay text-sm">{error}</p>}
          <button disabled={saving} className="bg-pine text-paper px-5 py-2 rounded text-sm hover:bg-pine-dark disabled:opacity-60">
            {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {notices.map((n) => (
          <div key={n.id} className="bg-white border border-line rounded-lg p-4 flex justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-pine-dark">{n.title}</h3>
                <span className="text-xs text-ink/40">{n.date}</span>
              </div>
              <p className="text-sm text-ink/60 mt-1">{n.content}</p>
            </div>
            <button onClick={() => remove(n.id)} className="text-clay hover:underline text-xs shrink-0 h-fit">
              মুছুন
            </button>
          </div>
        ))}
        {notices.length === 0 && <p className="text-ink/50 text-center py-6">কোনো নোটিশ যুক্ত করা হয়নি</p>}
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
      setError(data.error || "সমস্যা হয়েছে");
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl text-pine-dark">অ্যাটেনডেন্স ({attendance.length})</h2>
        <button
          onClick={() => setOpen((o) => !o)}
          className="bg-pine text-paper text-sm px-4 py-2 rounded hover:bg-pine-dark transition-colors"
        >
          {open ? "বাতিল" : "+ এন্ট্রি যুক্ত করুন"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-white border border-line rounded-lg p-5 mb-6 grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-ink/70 mb-1.5">শিক্ষার্থী</label>
            <select
              required
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
            >
              <option value="">নির্বাচন করুন</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.roll} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <Field label="তারিখ" value={form.date} onChange={(v) => setForm({ ...form, date: v })} type="date" required />
          <div>
            <label className="block text-sm text-ink/70 mb-1.5">অবস্থা</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
            >
              <option value="present">উপস্থিত</option>
              <option value="absent">অনুপস্থিত</option>
              <option value="late">দেরি</option>
            </select>
          </div>
          {error && <p className="sm:col-span-3 text-clay text-sm">{error}</p>}
          <div className="sm:col-span-3">
            <button disabled={saving} className="bg-pine text-paper px-5 py-2 rounded text-sm hover:bg-pine-dark disabled:opacity-60">
              {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-line">
              <th className="px-4 py-2.5 font-normal">শিক্ষার্থী</th>
              <th className="px-4 py-2.5 font-normal">তারিখ</th>
              <th className="px-4 py-2.5 font-normal">অবস্থা</th>
              <th className="px-4 py-2.5 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {attendance.slice(0, 100).map((a) => (
              <tr key={a.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">{studentName(a.studentId)}</td>
                <td className="px-4 py-2.5">{a.date}</td>
                <td className="px-4 py-2.5">{a.status === "present" ? "উপস্থিত" : a.status === "absent" ? "অনুপস্থিত" : "দেরি"}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => remove(a.id)} className="text-clay hover:underline text-xs">
                    মুছুন
                  </button>
                </td>
              </tr>
            ))}
            {attendance.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink/50">
                  কোনো এন্ট্রি নেই
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
