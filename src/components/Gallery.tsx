"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  DEFAULT_HEADER,
  DEFAULT_LINE,
  featureLineStyle,
  parseGalleryContent,
  usesCustomColor,
  usesCustomSize,
  type GalleryPhoto,
} from "@/lib/gallery";

// Each gallery item is shown as a large "feature" row: rounded photo on the
// left, title + description on the right (stacked on phones).
export default function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const { t } = useLanguage();

  return (
    <section id="gallery" className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <h2 className="font-display text-2xl text-heading">{t("gallery.title")}</h2>
      </div>

      {photos.length === 0 ? (
        <p className="text-ink/60 py-10 text-center">{t("gallery.empty")}</p>
      ) : (
        <div className="space-y-16 md:space-y-24">
          {photos.map((p) => {
            const content = parseGalleryContent(p.content);
            const header = content.header;
            return (
              <article key={p.id} className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt={header.text}
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-[4/3] object-cover rounded-3xl shadow-2xl shadow-black/30"
                />

                <div>
                  {header.text && (
                    <h3
                      style={featureLineStyle(header, DEFAULT_HEADER)}
                      className={`font-bold leading-tight mb-5 whitespace-pre-wrap ${
                        usesCustomSize(header, DEFAULT_HEADER) ? "" : "text-3xl sm:text-4xl"
                      } ${usesCustomColor(header, DEFAULT_HEADER) ? "" : "text-sky-600 dark:text-sky-400"}`}
                    >
                      {header.text}
                    </h3>
                  )}
                  <div className="space-y-2">
                    {content.lines.map((line, i) => (
                      <p
                        key={i}
                        style={featureLineStyle(line, DEFAULT_LINE)}
                        className={`leading-8 whitespace-pre-wrap ${
                          usesCustomSize(line, DEFAULT_LINE) ? "" : "text-base sm:text-lg"
                        } ${usesCustomColor(line, DEFAULT_LINE) ? "" : "text-ink/80"}`}
                      >
                        {line.text}
                      </p>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
