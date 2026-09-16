"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { StyledLine } from "@/lib/gallery";

const STYLE_OPTIONS: { value: StyledLine["style"]; labelKey: "gallery.styleNormal" | "gallery.styleItalic" | "gallery.styleBold" | "gallery.styleBoldItalic" }[] = [
  { value: "normal", labelKey: "gallery.styleNormal" },
  { value: "italic", labelKey: "gallery.styleItalic" },
  { value: "bold", labelKey: "gallery.styleBold" },
  { value: "bold-italic", labelKey: "gallery.styleBoldItalic" },
];

export default function StyledLineEditor({
  value,
  onChange,
  onRemove,
  placeholder,
}: {
  value: StyledLine;
  onChange: (next: StyledLine) => void;
  onRemove?: () => void;
  placeholder?: string;
}) {
  const { t } = useLanguage();

  return (
    <div className="bg-paper border border-line rounded-lg p-2.5 space-y-2">
      <textarea
        value={value.text}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-y min-h-[42px] border border-line rounded px-2.5 py-1.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-pine/40"
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          value={value.color}
          onChange={(e) => onChange({ ...value, color: e.target.value })}
          title={t("gallery.color")}
          className="w-9 h-9 rounded border border-line cursor-pointer bg-surface p-0.5"
        />
        <input
          type="number"
          min={10}
          max={48}
          value={value.fontSize}
          onChange={(e) => onChange({ ...value, fontSize: Number(e.target.value) || 16 })}
          title={t("gallery.fontSize")}
          className="w-16 border border-line rounded px-2 py-1.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-pine/40"
        />
        <select
          value={value.style}
          onChange={(e) => onChange({ ...value, style: e.target.value as StyledLine["style"] })}
          title={t("gallery.fontStyle")}
          className="border border-line rounded px-2 py-1.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-pine/40"
        >
          {STYLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-clay text-xs hover:underline shrink-0 ml-auto">
            {t("gallery.removeLine")}
          </button>
        )}
      </div>
    </div>
  );
}
