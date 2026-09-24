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
  type StyledLine,
} from "@/lib/gallery";

// The admin's custom font size is passed as a CSS variable so it can be applied
// only on medium+ screens (phones use fixed sizes, see the classes below).
function sizeVar(line: StyledLine, defaults: StyledLine): React.CSSProperties {
  return usesCustomSize(line, defaults) ? ({ "--fs": `${line.fontSize}px` } as React.CSSProperties) : {};
}

// Each gallery item is shown as a large "feature" row: rounded photo on the
// left, title + description on the right (stacked on phones).
export default function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const { t } = useLanguage();

  return (
    <section id="gallery" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="mb-6 md:mb-10">
        <h2 className="font-display text-2xl text-heading">{t("gallery.title")}</h2>
      </div>

      {photos.length === 0 ? (
        <p className="text-ink/60 py-10 text-center">{t("gallery.empty")}</p>
      ) : (
        <div className="space-y-10 md:space-y-24">
          {photos.map((p) => {
            const content = parseGalleryContent(p.content);
            const header = content.header;
            return (
              <article key={p.id} className="grid md:grid-cols-2 gap-4 md:gap-16 items-center">
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
                      style={{ ...featureLineStyle(header, DEFAULT_HEADER), ...sizeVar(header, DEFAULT_HEADER) }}
                      // Phones always get a big, readable title; the admin's own size only applies from md up.
                      className={`font-bold leading-tight mb-3 md:mb-5 whitespace-pre-wrap text-3xl ${
                        usesCustomSize(header, DEFAULT_HEADER) ? "md:[font-size:var(--fs)]" : "md:text-4xl"
                      } ${usesCustomColor(header, DEFAULT_HEADER) ? "" : "text-sky-600 dark:text-sky-400"}`}
                    >
                      {header.text}
                    </h3>
                  )}
                  <div className="space-y-1.5 md:space-y-2">
                    {content.lines.map((line, i) => (
                      <p
                        key={i}
                        style={{ ...featureLineStyle(line, DEFAULT_LINE), ...sizeVar(line, DEFAULT_LINE) }}
                        // Phones get small, compact description text; the admin's own size applies from md up.
                        className={`leading-6 md:leading-8 whitespace-pre-wrap text-sm ${
                          usesCustomSize(line, DEFAULT_LINE) ? "md:[font-size:var(--fs)]" : "md:text-lg"
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
