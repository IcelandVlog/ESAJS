"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/dictionaries";

const SEEN_KEY = "esajs_intro_seen";

export default function LanguageGate() {
  const [open, setOpen] = useState(false);
  const [isStudent, setIsStudent] = useState<boolean | null>(null);
  const [pickedLang, setPickedLang] = useState<Lang | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const { setLang } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const seen = window.localStorage.getItem(SEEN_KEY);
    if (!seen) setOpen(true);
  }, []);

  if (!open) return null;

  function handleContinue() {
    if (!pickedLang) {
      setShowWarning(true);
      return;
    }
    setLang(pickedLang);
    window.localStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
    if (isStudent) {
      router.push("/login?role=student");
    }
  }

  const isBn = pickedLang === "bn" || pickedLang === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-navy-900 px-6 py-5 text-center">
          <img src="/images/logo.png" alt="ESAJS" className="h-10 mx-auto object-contain" />
        </div>

        <div className="px-6 py-6 space-y-6">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3 text-center">
              {isBn ? "আপনি কি এই স্কুলের শিক্ষার্থী?" : "Are you a student of this school?"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsStudent(true)}
                className={`rounded-lg py-2.5 text-sm font-medium border transition-colors ${
                  isStudent === true
                    ? "bg-gradient-to-r from-brand-blue to-brand-pink text-white border-transparent"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {isBn ? "হ্যাঁ" : "Yes"}
              </button>
              <button
                type="button"
                onClick={() => setIsStudent(false)}
                className={`rounded-lg py-2.5 text-sm font-medium border transition-colors ${
                  isStudent === false
                    ? "bg-gradient-to-r from-brand-blue to-brand-pink text-white border-transparent"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {isBn ? "না" : "No"}
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-3 text-center">
              {isBn ? "ভাষা নির্বাচন করুন" : "Select your language"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPickedLang("bn");
                  setShowWarning(false);
                }}
                className={`rounded-lg py-2.5 text-sm font-medium border transition-colors ${
                  pickedLang === "bn"
                    ? "bg-navy-900 text-white border-navy-900"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => {
                  setPickedLang("en");
                  setShowWarning(false);
                }}
                className={`rounded-lg py-2.5 text-sm font-medium border transition-colors ${
                  pickedLang === "en"
                    ? "bg-navy-900 text-white border-navy-900"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                English
              </button>
            </div>
            {showWarning && (
              <p className="text-xs text-red-600 mt-2 text-center">
                {isBn ? "চালিয়ে যেতে একটি ভাষা নির্বাচন করুন" : "Please select a language to continue"}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-lg py-3 text-sm font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-pink hover:opacity-90 transition-opacity"
          >
            {isBn ? "প্রবেশ করুন" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
