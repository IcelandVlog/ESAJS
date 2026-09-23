"use client";

import { useRef, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export type ReunionToken = {
  id: number;
  batch: string;
  occasion: string;
  messageBody: string;
  venue: string;
  reunionDate: string | null;
  cancelled: boolean;
  token: string;
  recipientCount: number;
  smsSent: number;
  emailSent: number;
  failedCount: number;
  createdAt: string | null;
};

const EMOJIS = ["🎉", "🎓", "🏫", "📅", "⏰", "🎊", "👋", "❤️", "😊", "✨", "🎈", "📢", "🥳", "🤝", "📍", "🕰️"];

function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Emoji"
        className="border border-line rounded px-2 py-2.5 text-base leading-none hover:bg-line/30"
      >
        😀
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 bg-surface border border-line rounded-lg shadow-lg p-2 grid grid-cols-6 gap-1 w-56">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onSelect(e);
                  setOpen(false);
                }}
                className="text-lg hover:bg-line/40 rounded p-1"
              >
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Converts an ISO date string to the value a <input type="datetime-local"> wants,
// in the browser's local time (so the picker shows what the admin actually set).
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EditRow({
  tk,
  onCancel,
  onSaved,
}: {
  tk: ReunionToken;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [occasion, setOccasion] = useState(tk.occasion);
  const [venue, setVenue] = useState(tk.venue);
  const [reunionDate, setReunionDate] = useState(toDatetimeLocalValue(tk.reunionDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    if (!occasion.trim() || !reunionDate) return;
    setSaving(true);
    const res = await fetch(`/api/reunion-token/${tk.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occasion: occasion.trim(),
        venue: venue.trim(),
        reunionDate: new Date(reunionDate).toISOString(),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || t("admin.error"));
      return;
    }
    onSaved();
  }

  return (
    <tr className="border-b border-line bg-pine/5">
      <td className="px-4 py-2.5 border-r border-line">{tk.batch}</td>
      <td className="px-4 py-2.5 border-r border-line" colSpan={2}>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            className="border border-line rounded px-2 py-1.5 text-sm"
            placeholder={t("reunion.occasionPlaceholder")}
          />
          <input
            type="datetime-local"
            value={reunionDate}
            onChange={(e) => setReunionDate(e.target.value)}
            className="border border-line rounded px-2 py-1.5 text-sm"
          />
        </div>
      </td>
      <td className="px-4 py-2.5 border-r border-line">
        <input
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="w-full border border-line rounded px-2 py-1.5 text-sm"
          placeholder={t("reunion.venuePlaceholder")}
        />
      </td>
      <td className="px-4 py-2.5 border-r border-line font-mono">{tk.token}</td>
      <td className="px-4 py-2.5 border-r border-line">
        {tk.createdAt ? new Date(tk.createdAt).toLocaleDateString() : "-"}
      </td>
      <td className="px-4 py-2.5 border-r border-line">{tk.recipientCount}</td>
      <td className="px-4 py-2.5 border-r border-line">{tk.smsSent}</td>
      <td className="px-4 py-2.5 border-r border-line">{tk.emailSent}</td>
      <td className="px-4 py-2.5">
        <div className="flex flex-col gap-1.5 items-start">
          <div className="flex gap-1.5">
            <button
              onClick={save}
              disabled={saving}
              className="bg-pine text-on-navy px-3 py-1 rounded text-xs hover:bg-pine-dark disabled:opacity-60"
            >
              {saving ? t("reunion.saving") : t("reunion.save")}
            </button>
            <button onClick={onCancel} className="border border-line px-3 py-1 rounded text-xs hover:bg-line/30">
              {t("admin.cancel")}
            </button>
          </div>
          {error && <p className="text-clay text-xs">{error}</p>}
        </div>
      </td>
    </tr>
  );
}

export default function ReunionTab({ tokens, onChange }: { tokens: ReunionToken[]; onChange: () => void }) {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const currentYear = new Date().getFullYear();
  const batchYears = Array.from({ length: currentYear - 1960 + 1 }, (_, i) => currentYear - i);

  const [batch, setBatch] = useState("");
  const [occasion, setOccasion] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [venue, setVenue] = useState("");
  const [reunionDate, setReunionDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const rows = tokens;

  const occasionRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function insertAtCursor(
    ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
    value: string,
    setValue: (v: string) => void,
    emoji: string
  ) {
    const el = ref.current;
    if (!el) {
      setValue(value + emoji);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + emoji + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!batch || !occasion.trim() || !reunionDate) return;
    setSaving(true);
    const res = await fetch("/api/reunion-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batch,
        occasion: occasion.trim(),
        messageBody: messageBody.trim(),
        venue: venue.trim(),
        reunionDate: new Date(reunionDate).toISOString(),
      }),
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
    setOccasion("");
    setMessageBody("");
    setVenue("");
    setReunionDate("");
    onChange();
  }

  function applyLocalUpdate() {
    setEditingId(null);
    onChange();
  }

  async function toggleCancel(tk: ReunionToken) {
    const nextCancelled = !tk.cancelled;
    if (nextCancelled && !(await confirm(t("reunion.confirmCancel"), { confirmLabel: t("reunion.cancelToken") }))) return;
    setBusyId(tk.id);
    const res = await fetch(`/api/reunion-token/${tk.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancelled: nextCancelled }),
    });
    setBusyId(null);
    if (res.ok) {
      onChange();
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl text-heading mb-1">{t("reunion.title")}</h2>
      <p className="text-sm text-ink/60 mb-4">{t("reunion.subtitle")}</p>

      <form onSubmit={generate} className="bg-surface border border-line rounded-lg p-5 mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
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
          <div>
            <label className="block text-sm text-ink/70 mb-1.5">{t("reunion.dateTime")}</label>
            <input
              required
              type="datetime-local"
              value={reunionDate}
              onChange={(e) => setReunionDate(e.target.value)}
              className="border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-sm text-ink/70 mb-1.5">{t("reunion.venue")}</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder={t("reunion.venuePlaceholder")}
              className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-ink/70 mb-1.5">{t("reunion.occasion")}</label>
          <div className="flex items-center gap-2">
            <input
              ref={occasionRef}
              required
              type="text"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder={t("reunion.occasionPlaceholder")}
              className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
            />
            <EmojiPicker onSelect={(emoji) => insertAtCursor(occasionRef, occasion, setOccasion, emoji)} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-ink/70 mb-1.5">{t("reunion.messageBody")}</label>
          <div className="flex items-start gap-2">
            <textarea
              ref={bodyRef}
              rows={3}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder={t("reunion.messageBodyPlaceholder")}
              className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40 resize-y"
            />
            <EmojiPicker onSelect={(emoji) => insertAtCursor(bodyRef, messageBody, setMessageBody, emoji)} />
          </div>
        </div>

        <div>
          <button disabled={saving} className="bg-pine text-on-navy px-5 py-2.5 rounded text-sm hover:bg-pine-dark disabled:opacity-60">
            {saving ? t("reunion.generating") : t("reunion.generate")}
          </button>
        </div>
      </form>

      {error && <p className="text-clay text-sm mb-4">{error}</p>}
      {success && <p className="text-sm mb-4 bg-pine/10 border border-pine/20 text-heading rounded px-3 py-2">{success}</p>}
      <p className="text-xs text-ink/40 italic mb-6">{t("reunion.notConfiguredNotice")}</p>

      <h3 className="font-display text-lg text-heading mb-3">{t("reunion.history")}</h3>
      <div className="bg-surface border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[1080px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-line">
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.batch")}</th>
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.occasion")}</th>
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.eventDate")}</th>
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.venue")}</th>
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.token")}</th>
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.date")}</th>
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.recipients")}</th>
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.sms")}</th>
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.email")}</th>
              <th className="px-4 py-2.5 font-normal border-r border-line">{t("reunion.col.status")}</th>
              <th className="px-4 py-2.5 font-normal">{t("reunion.col.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tk) =>
              editingId === tk.id ? (
                <EditRow key={tk.id} tk={tk} onCancel={() => setEditingId(null)} onSaved={applyLocalUpdate} />
              ) : (
                <tr key={tk.id} className={`border-b border-line ${tk.cancelled ? "opacity-50" : ""}`}>
                  <td className="px-4 py-2.5 border-r border-line">{tk.batch}</td>
                  <td className="px-4 py-2.5 border-r border-line">{tk.occasion || "-"}</td>
                  <td className="px-4 py-2.5 border-r border-line">
                    {tk.reunionDate ? new Date(tk.reunionDate).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-2.5 border-r border-line">{tk.venue || "-"}</td>
                  <td className="px-4 py-2.5 border-r border-line font-mono">{tk.token}</td>
                  <td className="px-4 py-2.5 border-r border-line">
                    {tk.createdAt ? new Date(tk.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-2.5 border-r border-line">{tk.recipientCount}</td>
                  <td className="px-4 py-2.5 border-r border-line">{tk.smsSent}</td>
                  <td className="px-4 py-2.5 border-r border-line">{tk.emailSent}</td>
                  <td className="px-4 py-2.5 border-r border-line">
                    {tk.cancelled ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-clay/10 text-clay">
                        {t("reunion.status.cancelled")}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-pine/10 text-heading">
                        {t("reunion.status.active")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5 flex-wrap">
                      {!tk.cancelled && (
                        <button
                          onClick={() => setEditingId(tk.id)}
                          className="border border-line px-2.5 py-1 rounded text-xs hover:bg-line/30"
                        >
                          {t("reunion.edit")}
                        </button>
                      )}
                      <button
                        onClick={() => toggleCancel(tk)}
                        disabled={busyId === tk.id}
                        className={`px-2.5 py-1 rounded text-xs border disabled:opacity-60 ${
                          tk.cancelled
                            ? "border-pine/30 text-heading hover:bg-pine/10"
                            : "border-clay/30 text-clay hover:bg-clay/10"
                        }`}
                      >
                        {tk.cancelled ? t("reunion.reactivate") : t("reunion.cancelToken")}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-ink/50">
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
