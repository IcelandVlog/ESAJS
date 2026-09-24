"use client";

import { useEffect, useRef, useState } from "react";
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

const AUTOPLAY_MS = 6000;
const SWIPE_MIN_PX = 50;

// The admin's custom font size is passed as a CSS variable so it can be applied
// only on medium+ screens (phones use fixed sizes, see the classes below).
function sizeVar(line: StyledLine, defaults: StyledLine): React.CSSProperties {
  return usesCustomSize(line, defaults) ? ({ "--fs": `${line.fontSize}px` } as React.CSSProperties) : {};
}

// Gallery items are shown as large "feature" slides: rounded photo on the left,
// title + description on the right (stacked on phones). With 2+ items they become
// a slider (arrows, dots, swipe, auto-advance); a single item is shown as-is.
export default function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const { t } = useLanguage();
  const count = photos.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Photos can be added/removed while the page is open — keep the index valid.
  const current = count === 0 ? 0 : Math.min(index, count - 1);

  const go = (next: number) => setIndex(((next % count) + count) % count);

  // Auto-advance, unless hovering/touching or the person prefers reduced motion.
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, paused, index]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    setPaused(false);
    if (start === null) return;
    const delta = e.changedTouches[0].clientX - start;
    if (Math.abs(delta) >= SWIPE_MIN_PX) go(current + (delta < 0 ? 1 : -1));
  }

  return (
    <section id="gallery" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="mb-6 md:mb-10">
        <h2 className="font-display text-2xl text-heading">{t("gallery.title")}</h2>
      </div>

      {count === 0 ? (
        <p className="text-ink/60 py-10 text-center">{t("gallery.empty")}</p>
      ) : (
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") go(current - 1);
            if (e.key === "ArrowRight") go(current + 1);
          }}
        >
          <div className="overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {photos.map((p, i) => {
                const content = parseGalleryContent(p.content);
                const header = content.header;
                return (
                  <article
                    key={p.id}
                    aria-hidden={i !== current}
                    className="w-full shrink-0 grid md:grid-cols-2 gap-4 md:gap-16 items-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl}
                      alt={header.text}
                      loading={i === 0 ? "eager" : "lazy"}
                      decoding="async"
                      draggable={false}
                      className="w-full aspect-[4/3] object-cover rounded-3xl shadow-2xl shadow-black/30"
                    />

                    <div>
                      {header.text && (
                        <h3
                          style={featureLineStyle(header, DEFAULT_HEADER)}
                          // Two fixed sizes: text-2xl (24px) on phones, text-4xl (36px) from md up.
                          // Change these two classes to resize the title everywhere.
                          className={`font-bold leading-tight mb-3 md:mb-5 whitespace-pre-wrap text-2xl md:text-4xl ${
                            usesCustomColor(header, DEFAULT_HEADER) ? "" : "text-sky-600 dark:text-sky-400"
                          }`}
                        >
                          {header.text}
                        </h3>
                      )}
                      <div className="space-y-1.5 md:space-y-2">
                        {content.lines.map((line, j) => (
                          <p
                            key={j}
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
          </div>

          {count > 1 && (
            <div className="mt-6 md:mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => go(current - 1)}
                aria-label={t("gallery.prev")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink/70 hover:bg-ink/5 hover:text-heading transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`${i + 1} / ${count}`}
                    aria-current={i === current}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      i === current ? "w-7 bg-sky-500" : "w-2.5 bg-ink/25 hover:bg-ink/40"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => go(current + 1)}
                aria-label={t("gallery.next")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink/70 hover:bg-ink/5 hover:text-heading transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
