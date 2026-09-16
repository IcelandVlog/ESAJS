"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { parseGalleryContent, styledLineCss, type GalleryPhoto } from "@/lib/gallery";

export default function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState<number | null>(null);
  const active = photos.find((p) => p.id === activeId) || null;

  return (
    <section id="gallery" className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
      <div className="flex items-baseline justify-between mb-6 border-b border-line pb-3">
        <h2 className="font-display text-2xl text-heading">{t("gallery.title")}</h2>
      </div>

      {photos.length === 0 ? (
        <p className="text-ink/60 py-10 text-center">{t("gallery.empty")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((p) => {
            const content = parseGalleryContent(p.content);
            return (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className="group relative rounded-lg overflow-hidden border border-line aspect-square"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt={content.header.text}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {content.header.text && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs px-2 py-2 text-left truncate">
                    {content.header.text}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActiveId(null)}
        >
          <div
            className="bg-surface rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.imageUrl} alt="" className="w-full object-cover" />
            <div className="p-5">
              {(() => {
                const content = parseGalleryContent(active.content);
                return (
                  <>
                    {content.header.text && (
                      <p style={styledLineCss(content.header)} className="mb-2">
                        {content.header.text}
                      </p>
                    )}
                    {content.lines.map((line, i) => (
                      <p key={i} style={styledLineCss(line)} className="leading-relaxed">
                        {line.text}
                      </p>
                    ))}
                  </>
                );
              })()}
              <button
                onClick={() => setActiveId(null)}
                className="mt-4 text-sm text-heading font-medium hover:underline"
              >
                {t("gallery.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
