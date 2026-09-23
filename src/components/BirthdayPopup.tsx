"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Birthday = { id: number; name: string; photoUrl: string | null };
type Phase = "intro" | "profile";

const DISMISS_KEY_PREFIX = "esajs_birthday_dismissed_";
const INTRO_MS = 7000; // how long the animation plays before the profile appears

const COLORS = ["#ff5d8f", "#ffc145", "#3b5bfd", "#2ec4b6", "#a86bff", "#ff8a3d"];
const BALLOONS = [
  { left: 4, size: 54, delay: 0.2, dur: 8.5 },
  { left: 15, size: 44, delay: 1.1, dur: 9.5 },
  { left: 28, size: 62, delay: 0.6, dur: 7.8 },
  { left: 42, size: 48, delay: 1.7, dur: 9 },
  { left: 56, size: 58, delay: 0.3, dur: 8.2 },
  { left: 69, size: 46, delay: 1.4, dur: 9.8 },
  { left: 80, size: 60, delay: 0.8, dur: 8 },
  { left: 91, size: 50, delay: 1.9, dur: 9.2 },
];

// Everything here is plain CSS keyframes + sRGB colours, so it also renders
// on older Android phones (no oklab gradients, no background-clip:text).
const CSS = `
@keyframes bd-drop { 0%{transform:translateY(-70px);opacity:0} 100%{transform:translateY(0);opacity:1} }
@keyframes bd-swing { 0%,100%{transform:rotate(-7deg)} 50%{transform:rotate(7deg)} }
@keyframes bd-rise { 0%{transform:translateY(0)} 100%{transform:translateY(-130vh)} }
@keyframes bd-sway { 0%,100%{transform:translateX(-8px) rotate(-4deg)} 50%{transform:translateX(8px) rotate(4deg)} }
@keyframes bd-cake-in { 0%{transform:scale(0) translateY(40px);opacity:0} 70%{transform:scale(1.08) translateY(0);opacity:1} 100%{transform:scale(1);opacity:1} }
@keyframes bd-flame { 0%,100%{transform:scale(1,1) rotate(-3deg)} 50%{transform:scale(0.85,1.15) rotate(3deg)} }
@keyframes bd-glow { 0%,100%{opacity:.55} 50%{opacity:1} }
@keyframes bd-letter { 0%{transform:translateY(40px) scale(0.2);opacity:0} 60%{transform:translateY(-10px) scale(1.25);opacity:1} 100%{transform:translateY(0) scale(1);opacity:1} }
@keyframes bd-fade-up { 0%{transform:translateY(16px);opacity:0} 100%{transform:translateY(0);opacity:1} }
@keyframes bd-confetti { 0%{transform:translateY(-10vh) rotate(0deg)} 100%{transform:translateY(110vh) rotate(720deg)} }
@keyframes bd-fade-out { 0%{opacity:1} 100%{opacity:0} }
@keyframes bd-ring { 0%{box-shadow:0 0 0 0 rgba(214,36,159,.55)} 100%{box-shadow:0 0 0 22px rgba(214,36,159,0)} }
@keyframes bd-photo-in { 0%{transform:scale(0.3) rotate(-12deg);opacity:0} 70%{transform:scale(1.12) rotate(3deg);opacity:1} 100%{transform:scale(1) rotate(0)} }

.bd-stage { position:fixed; inset:0; z-index:100; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:#050c1c; background-image:radial-gradient(circle at 50% 45%, #1b2f66 0%, #0a1830 55%, #050c1c 100%); }
.bd-bunting { position:absolute; top:0; left:0; right:0; display:flex; justify-content:space-between; padding:0 6px; }
.bd-bunting::before { content:""; position:absolute; top:0; left:0; right:0; height:3px; background:#f5e6b8; }
.bd-flag { width:0; height:0; border-left:14px solid transparent; border-right:14px solid transparent; border-top:38px solid #ff5d8f;
  transform-origin:top center; animation:bd-drop .7s ease-out both, bd-swing 2.6s ease-in-out infinite; }
.bd-balloon { position:absolute; bottom:-130px; animation:bd-rise linear infinite; }
.bd-balloon-body { position:relative; border-radius:50% 50% 50% 50% / 58% 58% 42% 42%; animation:bd-sway 3s ease-in-out infinite; }
.bd-balloon-body::before { content:""; position:absolute; top:14%; left:20%; width:18%; height:24%; border-radius:50%; background:rgba(255,255,255,.45); transform:rotate(25deg); }
.bd-balloon-body::after { content:""; position:absolute; left:50%; top:100%; width:1px; height:60px; background:rgba(255,255,255,.4); }
.bd-title { position:relative; z-index:2; display:flex; flex-wrap:wrap; justify-content:center; gap:0 .35em; padding:0 16px; margin-bottom:22px;
  font-family:"Fraunces","Noto Sans Bengali",serif; font-weight:700; font-size:clamp(2.1rem,10vw,3.6rem); line-height:1.15; text-align:center; color:#fff;
  text-shadow:0 0 18px rgba(255,193,69,.55), 0 3px 0 rgba(0,0,0,.35); }
.bd-word { display:inline-flex; }
.bd-letter { display:inline-block; opacity:0; animation:bd-letter .6s cubic-bezier(.34,1.56,.64,1) forwards; }
.bd-cake { position:relative; z-index:2; width:220px; height:210px; opacity:0; animation:bd-cake-in .9s ease-out .5s forwards; }
.bd-plate { position:absolute; left:0; bottom:0; width:220px; height:14px; border-radius:50%; background:#dfe6f3; box-shadow:0 8px 20px rgba(0,0,0,.45); }
.bd-l1 { position:absolute; left:15px; bottom:10px; width:190px; height:58px; border-radius:10px; background:#ff8fb1; }
.bd-l2 { position:absolute; left:35px; bottom:68px; width:150px; height:50px; border-radius:10px; background:#ffd166; }
.bd-l3 { position:absolute; left:55px; bottom:118px; width:110px; height:42px; border-radius:10px; background:#a86bff; }
.bd-icing { position:absolute; left:0; right:0; top:0; height:12px; border-radius:10px 10px 0 0; background:#fff; }
.bd-icing::after { content:""; position:absolute; left:8%; right:8%; top:9px; height:10px; border-radius:0 0 12px 12px; background:#fff; }
.bd-candle { position:absolute; bottom:158px; width:9px; height:30px; border-radius:3px; background:#fff; background-image:repeating-linear-gradient(45deg,#ff5d8f 0 6px,#fff 6px 12px); }
.bd-flame { position:absolute; left:50%; margin-left:-6px; top:-20px; width:12px; height:19px; border-radius:50% 50% 50% 50% / 62% 62% 38% 38%;
  background:#ffb020; box-shadow:0 0 14px 5px rgba(255,176,32,.75); opacity:0; animation:bd-flame .35s ease-in-out infinite, bd-fade-up .5s ease-out 1.7s forwards; }
.bd-flame::after { content:""; position:absolute; left:3px; bottom:0; width:6px; height:10px; border-radius:50%; background:#fff3b0; }
.bd-confetti { position:absolute; top:0; animation:bd-confetti linear infinite; }
.bd-skip { position:absolute; top:calc(env(safe-area-inset-top, 0px) + 46px); right:14px; z-index:5; border:1px solid rgba(255,255,255,.35);
  background:rgba(255,255,255,.1); color:#fff; border-radius:999px; padding:6px 14px; font-size:12px; }
.bd-hint { position:absolute; bottom:calc(env(safe-area-inset-bottom, 0px) + 18px); left:0; right:0; text-align:center; font-size:11px; color:rgba(255,255,255,.5); z-index:5; }
.bd-out { animation:bd-fade-out .45s ease-in forwards; }
.bd-photo-in { animation:bd-photo-in .7s cubic-bezier(.34,1.56,.64,1) .15s both; }
.bd-ring { animation:bd-ring 1.6s ease-out infinite; }
.bd-fade-up { animation:bd-fade-up .6s ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .bd-stage * { animation-duration:.01ms !important; animation-delay:0s !important; }
}
`;

function splitTitle(text: string, lang: string): string[][] {
  // English: animate letter by letter. Bengali: animate whole words, because
  // splitting Bengali per character would break conjuncts/vowel signs.
  const words = text.split(" ");
  return words.map((w) => (lang === "en" ? Array.from(w) : [w]));
}

export default function BirthdayPopup() {
  const { t, lang } = useLanguage();
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    fetch("/api/birthdays/today")
      .then((res) => res.json())
      .then((data: { birthdays?: Birthday[] }) => {
        const list = data.birthdays || [];
        if (list.length === 0) return;
        let dismissed = false;
        try {
          dismissed = localStorage.getItem(DISMISS_KEY_PREFIX + todayKey) === "1";
        } catch {
          dismissed = false;
        }
        if (dismissed) return;
        let reduce = false;
        try {
          reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        } catch {
          reduce = false;
        }
        setBirthdays(list);
        setPhase(reduce ? "profile" : "intro");
      })
      .catch(() => {});
  }, []);

  // Intro plays for a few seconds, then hands over to the birthday profile.
  useEffect(() => {
    if (phase !== "intro") return;
    const timer = setTimeout(goToProfile, INTRO_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function goToProfile() {
    setLeaving(true);
    setTimeout(() => {
      setPhase("profile");
      setLeaving(false);
    }, 400);
  }

  function close() {
    setPhase(null);
    const todayKey = new Date().toISOString().slice(0, 10);
    try {
      localStorage.setItem(DISMISS_KEY_PREFIX + todayKey, "1");
    } catch {
      // ignore — worst case the popup reappears next page load today
    }
  }

  if (!phase || birthdays.length === 0) return null;

  /* ------------------------------ Phase 1: animation ------------------------------ */
  if (phase === "intro") {
    const title = splitTitle(t("birthday.title"), lang);
    let letterIndex = 0;

    return (
      <div
        className={`bd-stage ${leaving ? "bd-out" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={t("birthday.title")}
        onClick={goToProfile}
      >
        <style>{CSS}</style>

        {/* Bunting */}
        <div className="bd-bunting" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="bd-flag"
              style={{
                borderTopColor: COLORS[i % COLORS.length],
                animationDelay: `${i * 0.06}s, ${i * 0.15}s`,
              }}
            />
          ))}
        </div>

        {/* Balloons */}
        <div aria-hidden="true">
          {BALLOONS.map((b, i) => (
            <div
              key={i}
              className="bd-balloon"
              style={{ left: `${b.left}%`, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}
            >
              <div
                className="bd-balloon-body"
                style={{
                  width: b.size,
                  height: b.size * 1.2,
                  background: COLORS[i % COLORS.length],
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Confetti */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {Array.from({ length: 34 }).map((_, i) => (
            <span
              key={i}
              className="bd-confetti"
              style={{
                left: `${(i * 29 + 7) % 100}%`,
                width: 7 + (i % 3) * 2,
                height: 12 + (i % 4) * 2,
                background: COLORS[(i * 5) % COLORS.length],
                animationDuration: `${3.2 + (i % 5) * 0.5}s`,
                animationDelay: `${1.2 + (i % 9) * 0.35}s`,
                opacity: 0.9,
              }}
            />
          ))}
        </div>

        {/* Title: letters pop in one by one */}
        <h2 className="bd-title" aria-label={t("birthday.title")}>
          {title.map((word, wi) => (
            <span key={wi} className="bd-word" aria-hidden="true">
              {word.map((ch, ci) => {
                const delay = 1.6 + letterIndex++ * (lang === "en" ? 0.09 : 0.35);
                return (
                  <span key={ci} className="bd-letter" style={{ animationDelay: `${delay}s` }}>
                    {ch}
                  </span>
                );
              })}
            </span>
          ))}
        </h2>

        {/* Cake with three candles */}
        <div className="bd-cake" aria-hidden="true">
          <div className="bd-plate" />
          <div className="bd-l1">
            <div className="bd-icing" />
          </div>
          <div className="bd-l2">
            <div className="bd-icing" />
          </div>
          <div className="bd-l3">
            <div className="bd-icing" />
          </div>
          {[78, 105, 132].map((left, i) => (
            <div key={i} className="bd-candle" style={{ left }}>
              <span className="bd-flame" style={{ animationDelay: `${i * 0.07}s, ${1.7 + i * 0.25}s` }} />
            </div>
          ))}
        </div>

        <button type="button" className="bd-skip" onClick={goToProfile}>
          {t("birthday.skip")}
        </button>
        <p className="bd-hint">{t("birthday.tapSkip")}</p>
      </div>
    );
  }

  /* ------------------------------ Phase 2: profile ------------------------------ */
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(5,12,28,0.85)" }}
      role="dialog"
      aria-modal="true"
      aria-label={t("birthday.title")}
      onClick={close}
    >
      <style>{CSS}</style>

      {/* A few confetti pieces keep drifting behind the card */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="bd-confetti"
            style={{
              left: `${(i * 37 + 5) % 100}%`,
              width: 7 + (i % 3) * 2,
              height: 12 + (i % 4) * 2,
              background: COLORS[(i * 5) % COLORS.length],
              animationDuration: `${4 + (i % 5) * 0.6}s`,
              animationDelay: `${(i % 7) * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div
        className="relative w-full max-w-sm rounded-2xl bg-surface border border-line shadow-2xl overflow-hidden text-center max-h-[92vh] overflow-y-auto"
        style={{ animation: "birthday-pop 0.35s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label={t("birthday.close")}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 dark:bg-white/10 text-ink/60 hover:text-ink transition-colors"
        >
          ✕
        </button>

        <div className="relative px-6 pt-10 pb-6 space-y-5">
          <p className="text-xs uppercase tracking-widest text-ink/50 bd-fade-up">{t("birthday.eyebrow")}</p>

          <div className="space-y-7">
            {birthdays.map((b, i) => (
              <div key={b.id} className="space-y-4">
                <div className="bd-photo-in mx-auto w-28 h-28" style={{ animationDelay: `${0.15 + i * 0.2}s` }}>
                  {b.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.photoUrl}
                      alt={b.name}
                      decoding="async"
                      className="bd-ring w-28 h-28 rounded-full object-cover shadow-lg"
                      style={{ border: "4px solid #d6249f" }}
                    />
                  ) : (
                    <div
                      className="bd-ring w-28 h-28 rounded-full flex items-center justify-center text-5xl"
                      style={{ border: "4px solid #d6249f", background: "rgba(128,128,128,0.15)" }}
                    >
                      🎂
                    </div>
                  )}
                </div>
                <p className="font-display text-xl text-heading bd-fade-up" style={{ animationDelay: `${0.6 + i * 0.2}s` }}>
                  {b.name}
                </p>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl p-4 text-white bd-fade-up"
            style={{
              animationDelay: "0.9s",
              backgroundColor: "#3b5bfd",
              backgroundImage: "linear-gradient(to right, #3b5bfd, #d6249f)",
            }}
          >
            <p className="font-display text-2xl">🎂 {t("birthday.title")}</p>
          </div>

          <p className="text-sm text-ink/60 leading-relaxed bd-fade-up" style={{ animationDelay: "1.1s" }}>
            {t("birthday.wish")}
          </p>

          <button
            onClick={close}
            className="w-full rounded-xl py-3 font-bold text-white hover:opacity-90 transition-opacity shadow-lg bd-fade-up"
            style={{
              animationDelay: "1.2s",
              backgroundColor: "#0ea5e9",
              backgroundImage: "linear-gradient(to right, #38bdf8, #22d3ee)",
            }}
          >
            {t("birthday.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
