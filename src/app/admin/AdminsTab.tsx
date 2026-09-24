"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useConfirm } from "@/components/ConfirmDialog";
import { FIRST_BATCH_YEAR } from "@/lib/validation";

type BatchAdmin = { id: number; name: string; username: string; batch: string | null; createdAt: string | null };

const inputClass =
  "w-full border border-line rounded px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-pine/40";

// Main admin only: create / remove batch admins (max 2 per batch) and reset their password.
export default function AdminsTab() {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const [list, setList] = useState<BatchAdmin[]>([]);
  const [max, setMax] = useState(2);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", batch: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Password reset: which admin is being reset + the new password typed in.
  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");

  const batchYears = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: current - FIRST_BATCH_YEAR + 1 }, (_, i) => current - i);
  }, []);

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
    setSaving(true);
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("admin.error"));
        return;
      }
      setForm({ name: "", username: "", password: "", batch: "" });
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

  const batchFull = form.batch !== "" && countFor(form.batch) >= max;

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
        <form onSubmit={submit} className="bg-surface border border-line rounded-lg p-5 mb-6 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-ink/70 mb-1.5">{t("admin.field.name")}</label>
            <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-ink/70 mb-1.5">{t("admin.field.batch")}</label>
            <select required className={inputClass} value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })}>
              <option value="">{t("admin.selectPlaceholder")}</option>
              {batchYears.map((y) => (
                <option key={y} value={String(y)} disabled={countFor(String(y)) >= max}>
                  {y} ({countFor(String(y))}/{max})
                </option>
              ))}
            </select>
            {batchFull && <p className="text-xs text-clay mt-1">{t("admins.batchFull").replace("{max}", String(max))}</p>}
          </div>
          <div>
            <label className="block text-sm text-ink/70 mb-1.5">{t("admins.username")}</label>
            <input
              required
              autoComplete="off"
              className={inputClass}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-ink/70 mb-1.5">{t("admins.password")}</label>
            <div className="flex gap-2">
              <input
                required
                autoComplete="new-password"
                type={showPassword ? "text" : "password"}
                className={inputClass}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="px-3 rounded border border-line text-xs text-ink/70 hover:bg-ink/5 whitespace-nowrap"
              >
                {showPassword ? t("admins.hide") : t("admins.show")}
              </button>
            </div>
            <p className="text-xs text-ink/50 mt-1">{t("admins.passwordHint")}</p>
          </div>
          {error && <p className="sm:col-span-2 text-clay text-sm bg-clay/10 border border-clay/20 rounded px-3 py-2">{error}</p>}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving || batchFull}
              className="bg-pine text-on-navy px-6 py-2.5 rounded text-sm hover:bg-pine-dark transition-colors disabled:opacity-60"
            >
              {saving ? t("admin.saving") : t("admins.create")}
            </button>
          </div>
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
