"use client";

import { useRef, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { resizeImageToDataUrl } from "@/lib/resizeImage";
import {
  DEFAULT_HEADER,
  DEFAULT_LINE,
  parseGalleryContent,
  styledLineCss,
  type GalleryPhoto,
  type StyledLine,
} from "@/lib/gallery";
import StyledLineEditor from "@/components/StyledLineEditor";

export default function GalleryTab({ photos, onChange }: { photos: GalleryPhoto[]; onChange: () => void }) {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [header, setHeader] = useState<StyledLine>({ ...DEFAULT_HEADER });
  const [lines, setLines] = useState<StyledLine[]>([{ ...DEFAULT_LINE }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // Set while editing an existing photo; null means the form adds a new one.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [imageChanged, setImageChanged] = useState(false);

  function resetForm() {
    setEditingId(null);
    setImageChanged(false);
    setImageUrl(null);
    setHeader({ ...DEFAULT_HEADER });
    setLines([{ ...DEFAULT_LINE }]);
    setError("");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    // Gallery photos can be larger/sharper than a tiny avatar — 900px max side.
    const dataUrl = await resizeImageToDataUrl(file, 900, 0.85);
    setImageUrl(dataUrl);
    setImageChanged(true);
  }

  function startEdit(p: GalleryPhoto) {
    const c = parseGalleryContent(p.content);
    setEditingId(p.id);
    setImageChanged(false);
    setImageUrl(p.imageUrl);
    setHeader(c.header);
    setLines(c.lines.length > 0 ? c.lines : [{ ...DEFAULT_LINE }]);
    setError("");
    setOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateLine(index: number, next: StyledLine) {
    setLines((prev) => prev.map((l, i) => (i === index ? next : l)));
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!imageUrl) {
      setError(t("gallery.imageRequired"));
      return;
    }
    setSaving(true);
    const content = JSON.stringify({ header, lines: lines.filter((l) => l.text.trim() !== "") });
    const res = await fetch(editingId ? `/api/gallery/${editingId}` : "/api/gallery", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      // When editing, only send the image if a new one was picked.
      body: JSON.stringify(editingId && !imageChanged ? { content } : { imageUrl, content }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || t("admin.error"));
      return;
    }
    resetForm();
    setOpen(false);
    onChange();
  }

  async function remove(id: number) {
    if (!(await confirm(t("gallery.confirmDelete"), { confirmLabel: t("admin.delete") }))) return;
    await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl text-heading">
          {t("gallery.title")} ({photos.length})
        </h2>
        <button
          onClick={() => {
            if (open) resetForm();
            setOpen((o) => !o);
          }}
          className="bg-pine text-on-navy text-sm px-4 py-2 rounded hover:bg-pine-dark transition-colors"
        >
          {open ? t("admin.cancel") : t("gallery.addPhoto")}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-surface border border-line rounded-lg p-5 mb-6 space-y-4">
          <h3 className="font-display text-lg text-heading">
            {editingId ? t("gallery.editPhoto") : t("gallery.addPhoto")}
          </h3>
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border border-line rounded-lg px-4 py-2 text-sm hover:bg-paper transition-colors"
            >
              {imageUrl ? t("gallery.changeImage") : t("gallery.uploadImage")}
            </button>
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="mt-3 w-full max-w-xs rounded-lg border border-line object-cover" />
            )}
          </div>

          <div>
            <label className="block text-sm text-ink/70 mb-1.5">{t("gallery.header")}</label>
            <StyledLineEditor
              value={header}
              onChange={setHeader}
              placeholder={t("gallery.headerPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm text-ink/70 mb-1.5">{t("gallery.title")}</label>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <StyledLineEditor
                  key={i}
                  value={line}
                  onChange={(next) => updateLine(i, next)}
                  onRemove={lines.length > 1 ? () => removeLine(i) : undefined}
                  placeholder={t("gallery.linePlaceholder")}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, { ...DEFAULT_LINE }])}
              className="mt-2 text-sm text-heading font-medium hover:underline"
            >
              + {t("gallery.addLine")}
            </button>
          </div>

          {error && <p className="text-clay text-sm">{error}</p>}

          <button disabled={saving} className="bg-pine text-on-navy px-5 py-2 rounded text-sm hover:bg-pine-dark disabled:opacity-60">
            {saving ? t("gallery.saving") : t("gallery.save")}
          </button>
        </form>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((p) => {
          const content = parseGalleryContent(p.content);
          return (
            <div key={p.id} className="bg-surface border border-line rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt={content.header.text} className="w-full aspect-square object-cover" />
              <div className="p-3">
                <p style={styledLineCss(content.header)} className="truncate">
                  {content.header.text}
                </p>
                <div className="flex gap-3 mt-1">
                  <button onClick={() => startEdit(p)} className="text-heading hover:underline text-xs">
                    {t("admin.edit")}
                  </button>
                  <button onClick={() => remove(p.id)} className="text-clay hover:underline text-xs">
                    {t("admin.delete")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {photos.length === 0 && <p className="text-ink/50 text-center py-6 col-span-full">{t("gallery.empty")}</p>}
      </div>
    </div>
  );
}
