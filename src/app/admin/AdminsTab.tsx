"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useConfirm } from "@/components/ConfirmDialog";
import { NON_STUDENT_BATCH } from "@/lib/validation";

export type StudentOption = { id: number; name: string; roll: string; phone: string; batch: string | null; approved: boolean };

type BatchAdmin = { id: number; name: string; username: string; batch: string | null; createdAt: string | null };

const inputClass =
  "w-full border border-line rounded px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-pine/40";

// Main admin only: create / remove batch admins (max 2 per batch) and reset their password.
export default function AdminsTab({ students }: { students: StudentOption[] }) {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const [list, setList] = useState<BatchAdmin[]>([]);
  const [max, setMax] = useState(2);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  // The student the main admin picked to become a batch admin, plus a name filter for the dropdown.
  const [studentId, setStudentId] = useState("");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // Password reset: which admin is being reset + the new password typed in.
  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admins");
    const data = await res.json();
    setList(data.admins || []);
    if (data.maxPerBatch) setMax(data.maxPerBatch);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const countFor = (batch: string) => list.filter((a) => a.batch === batch).length;

  // Students who can be picked: approved, in a real batch (not "other"/empty), and not admins already.
  // Their login id (email/roll) is the admin username, so that is how we spot existing admins.
  const candidates = useMemo(() => {
    const adminLogins = new Set(list.map((a) => a.username));
    const q = filter.trim().toLowerCase();
    return students
      .filter((s) => s.approved && s.batch && s.batch !== NON_STUDENT_BATCH && /^\d{4}$/.test(s.batch))
      .filter((s) => !adminLogins.has(s.roll))
      .filter((s) => !q || s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q))
      .sort((a, b) => Number(b.batch) - Number(a.batch) || a.name.localeCompare(b.name));
  }, [students, list, filter]);

  const candidatesByBatch = useMemo(() => {
    const map = new Map<string, StudentOption[]>();
    for (const s of candidates) map.set(s.batch as string, [...(map.get(s.batch as string) ?? []), s]);
    return [...map.entries()];
  }, [candidates]);

  const selected = students.find((s) => String(s.id) === studentId) ?? null;
  const contactOf = (s: StudentOption) => (s.roll.includes("@") ? s.roll : s.phone || s.roll);

  // Group by batch, newest batch first.
  const groups = useMemo(() => {
    const map = new Map<string, BatchAdmin[]>();
    for (const a of list) {
      const key = a.batch || "";
      map.set(key, [...(map.get(key) ?? []), a]);
    }
    return [...map.entries()].sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [list]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selected.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("admin.error"));
        return;
      }
      setStudentId("");
      setFilter("");
      setOpen(false);
      await load();
    } catch {
      setError(t("admin.error"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(a: BatchAdmin) {
    if (!(await confirm(t("admins.confirmDelete").replace("{name}", a.name), { confirmLabel: t("admin.delete") }))) return;
    await fetch(`/api/admins/${a.id}`, { method: "DELETE" });
    await load();
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (resetId === null) return;
    setResetError("");
    const res = await fetch(`/api/admins/${resetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResetError(data.error || t("admin.error"));
      return;
    }
    setResetId(null);
    setResetPassword("");
  }

  const batchFull = !!selected && countFor(selected.batch as string) >= max;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-xl text-heading">
          {t("admins.title")} ({list.length})
        </h2>
        <button
          onClick={() => {
            setOpen((o) => !o);
            setError("");
          }}
          className="bg-pine text-on-navy text-sm px-4 py-2 rounded hover:bg-pine-dark transition-colors"
        >
          {open ? t("admin.cancel") : t("admins.add")}
        </button>
      </div>
      <p className="text-sm text-ink/60 mb-6">{t("admins.hint").replace("{max}", String(max))}</p>

      {open && (
        <form onSubmit={submit} className="bg-surface border border-line rounded-lg p-5 mb-6 space-y-4">
          <h3 className="font-display text-lg text-heading">{t("admins.pickStudent")}</h3>
          <input
            type="search"
            placeholder={t("admins.searchStudent")}
            className={inputClass}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select required className={inputClass} value={studentId} onChange={(e) => setStudentId(e.target.value)} size={1}>
            <option value="">{t("admins.selectStudent")}</option>
            {candidatesByBatch.map(([batch, group]) => {
              const full = countFor(batch) >= max;
              return (
                <optgroup key={batch} label={`${t("admin.field.batch")} ${batch} (${countFor(batch)}/${max})${full ? ` — ${t("admins.full")}` : ""}`}>
                  {group.map((s) => (
                    <option key={s.id} value={String(s.id)} disabled={full}>
                      {s.name} — {contactOf(s)}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          {candidates.length === 0 && <p className="text-xs text-ink/50">{t("admins.noCandidates")}</p>}

          {selected && (
            <div className="rounded-lg border border-line bg-ink/[0.03] p-3 text-sm">
              <p className="font-medium text-heading">{selected.name}</p>
              <p className="text-ink/60">
                {t("admin.field.batch")} {selected.batch} · {contactOf(selected)}
              </p>
            </div>
          )}
          {batchFull && <p className="text-xs text-clay">{t("admins.batchFull").replace("{max}", String(max))}</p>}
          <p className="text-xs text-ink/50">{t("admins.loginNote")}</p>

          {error && <p className="text-clay text-sm bg-clay/10 border border-clay/20 rounded px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={saving || !selected || batchFull}
            className="bg-pine text-on-navy px-6 py-2.5 rounded text-sm hover:bg-pine-dark transition-colors disabled:opacity-60"
          >
            {saving ? t("admin.saving") : t("admins.create")}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-ink/50">{t("admin.loading")}</p>
      ) : groups.length === 0 ? (
        <p className="text-ink/50 bg-surface border border-line rounded-lg p-8 text-center">{t("admins.empty")}</p>
      ) : (
        <div className="space-y-5">
          {groups.map(([batch, admins]) => (
            <div key={batch} className="bg-surface border border-line rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-ink/[0.03]">
                <span className="font-medium text-heading">
                  {t("admin.field.batch")} {batch}
                </span>
                <span className="text-xs text-ink/50">
                  {admins.length}/{max}
                </span>
              </div>
              <ul>
                {admins.map((a) => (
                  <li key={a.id} className="px-4 py-3 border-b border-line last:border-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{a.name}</p>
                        <p className="text-xs text-ink/50">
                          {t("admins.username")}: <span className="font-mono">{a.username}</span>
                        </p>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <button
                          onClick={() => {
                            setResetId(resetId === a.id ? null : a.id);
                            setResetPassword("");
                            setResetError("");
                          }}
                          className="text-heading font-medium hover:underline"
                        >
                          {t("admins.resetPassword")}
                        </button>
                        <button onClick={() => remove(a)} className="text-clay hover:underline">
                          {t("admin.delete")}
                        </button>
                      </div>
                    </div>
                    {resetId === a.id && (
                      <form onSubmit={submitReset} className="mt-3 flex flex-col sm:flex-row gap-2">
                        <input
                          required
                          autoComplete="new-password"
                          type="text"
                          placeholder={t("admins.newPassword")}
                          className={inputClass}
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                        />
                        <button type="submit" className="bg-pine text-on-navy px-5 py-2.5 rounded text-sm hover:bg-pine-dark whitespace-nowrap">
                          {t("admin.save")}
                        </button>
                      </form>
                    )}
                    {resetId === a.id && resetError && <p className="text-clay text-xs mt-2">{resetError}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
