"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export type ReunionToken = {
  id: number;
  batch: string;
  token: string;
  recipientCount: number;
  smsSent: number;
  emailSent: number;
  failedCount: number;
  createdAt: string | null;
};

export default function ReunionTab({ tokens, onChange }: { tokens: ReunionToken[]; onChange: () => void }) {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const batchYears = Array.from({ length: currentYear - 1960 + 1 }, (_, i) => currentYear - i);

  const [batch, setBatch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!batch) return;
    setSaving(true);
    const res = await fetch("/api/reunion-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batch }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || t("admin.error"));
      return;
    }
    const summary = t("reunion.successSummary")
      .replace("{token}", data.token.token)
      .replace("{sms}", String(data.token.smsSent))
      .replace("{email}", String(data.token.emailSent));
    setSuccess(summary);
    setBatch("");
    onChange();
  }

  return (
    <div>
      <h2 className="font-display text-xl text-heading mb-1">{t("reunion.title")}</h2>
      <p className="text-sm text-ink/60 mb-4">{t("reunion.subtitle")}</p>

      <form onSubmit={generate} className="bg-surface border border-line rounded-lg p-5 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm text-ink/70 mb-1.5">{t("reunion.selectBatch")}</label>
          <select
            required
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="border border-line rounded px-3 py-2.5 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-pine/40"
          >
            <option value="">{t("reunion.selectBatch")}</option>
            {batchYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button disabled={saving} className="bg-pine text-on-navy px-5 py-2.5 rounded text-sm hover:bg-pine-dark disabled:opacity-60">
          {saving ? t("reunion.generating") : t("reunion.generate")}
        </button>
      </form>

      {error && <p className="text-clay text-sm mb-4">{error}</p>}
      {success && <p className="text-sm mb-4 bg-pine/10 border border-pine/20 text-heading rounded px-3 py-2">{success}</p>}
      <p className="text-xs text-ink/40 italic mb-6">{t("reunion.notConfiguredNotice")}</p>

      <h3 className="font-display text-lg text-heading mb-3">{t("reunion.history")}</h3>
      <div className="bg-surface border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-line">
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.batch")}</th>
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.token")}</th>
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.date")}</th>
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.recipients")}</th>
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.sms")}</th>
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.email")}</th>
              <th className="px-4 py-2.5 font-normal">{t("reunion.col.failed")}</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((tk) => (
              <tr key={tk.id} className="border-b border-line">
                <td className="px-4 py-2.5 border-r border-line">{tk.batch}</td>
                <td className="px-4 py-2.5 border-r border-line font-mono">{tk.token}</td>
                <td className="px-4 py-2.5 border-r border-line">
                  {tk.createdAt ? new Date(tk.createdAt).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-2.5 border-r border-line">{tk.recipientCount}</td>
                <td className="px-4 py-2.5 border-r border-line">{tk.smsSent}</td>
                <td className="px-4 py-2.5 border-r border-line">{tk.emailSent}</td>
                <td className="px-4 py-2.5 text-clay">{tk.failedCount || "-"}</td>
              </tr>
            ))}
            {tokens.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink/50">
                  {t("reunion.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
