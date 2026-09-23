"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type ConfirmOptions = {
  /** Text on the confirm button, e.g. "মুছুন". Defaults to a generic "OK". */
  confirmLabel?: string;
  /** "danger" (red, default) for destructive actions, "default" for neutral ones. */
  tone?: "danger" | "default";
};

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

type Pending = { message: string; options: ConfirmOptions; resolve: (v: boolean) => void };

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [pending, setPending] = useState<Pending | null>(null);
  const [visible, setVisible] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((message, options = {}) => {
    return new Promise<boolean>((resolve) => {
      setPending({ message, options, resolve });
    });
  }, []);

  const close = useCallback(
    (result: boolean) => {
      setVisible(false);
      const p = pending;
      // Let the fade-out play, then resolve and unmount.
      setTimeout(() => {
        p?.resolve(result);
        setPending(null);
      }, 150);
    },
    [pending]
  );

  // Fade in, focus the safe button, lock page scroll, Esc = cancel.
  useEffect(() => {
    if (!pending) return;
    const raf = requestAnimationFrame(() => {
      setVisible(true);
      cancelRef.current?.focus();
    });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [pending, close]);

  const danger = (pending?.options.tone ?? "danger") === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-150 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => close(false)}
          role="presentation"
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center shadow-2xl transition-all duration-150 ${
              visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                danger ? "bg-red-500/15 text-red-500" : "bg-brand-blue/15 text-brand-blue"
              }`}
            >
              {danger ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              )}
            </div>

            <h2 id="confirm-title" className="font-display text-lg text-heading mb-2">
              {t("confirm.title")}
            </h2>
            <p id="confirm-message" className="text-sm leading-relaxed text-ink/70 mb-6">
              {pending.message}
            </p>

            <div className="flex gap-3">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => close(false)}
                className="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 transition-colors"
              >
                {t("confirm.dismiss")}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 transition-colors ${
                  danger
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500/50"
                    : "bg-brand-blue hover:opacity-90 focus:ring-brand-blue/50"
                }`}
              >
                {pending.options.confirmLabel ?? t("confirm.ok")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}
