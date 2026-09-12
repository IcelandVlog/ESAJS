"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [role, setRole] = useState<"admin" | "student">("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("role") === "admin") setRole("admin");
    if (searchParams.get("role") === "student") setRole("student");
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("login.error"));
        setLoading(false);
        return;
      }
      router.push(role === "admin" ? "/admin" : "/student");
      router.refresh();
    } catch {
      setError(t("login.error"));
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-16 bg-paper">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl text-pine-dark mb-2 text-center">
            {role === "admin" ? t("adminLogin.title") : t("login.title")}
          </h1>
          {role !== "admin" && (
            <p className="text-center text-ink/60 text-sm mb-8">{t("login.subtitle")}</p>
          )}

          <form
            onSubmit={handleSubmit}
            className={`space-y-4 bg-white border border-line rounded-lg p-6 ${role !== "admin" ? "" : "mt-8"}`}
          >
            <div>
              <label className="block text-sm text-ink/70 mb-1.5">
                {role === "student" ? t("login.roll") : t("login.username")}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
                placeholder={role === "student" ? "101" : "admin"}
              />
            </div>
            <div>
              <label className="block text-sm text-ink/70 mb-1.5">{t("login.password")}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-clay text-sm bg-clay/10 border border-clay/20 rounded px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pine text-paper py-2.5 rounded font-medium hover:bg-pine-dark transition-colors disabled:opacity-60"
            >
              {loading ? t("login.loading") : t("login.submit")}
            </button>
          </form>

          {role === "student" && (
            <p className="text-center mt-5 text-sm text-ink/60">
              <Link href="/register" className="text-pine-dark font-medium hover:underline">
                {t("login.newHere")}
              </Link>
            </p>
          )}

          <div className="flex items-center justify-between mt-6 text-xs text-ink/40">
            <Link href="/" className="hover:text-pine-dark transition-colors">
              {t("login.backHome")}
            </Link>
            {role === "student" ? (
              <button onClick={() => setRole("admin")} className="hover:text-pine-dark transition-colors">
                {t("adminLogin.link")}
              </button>
            ) : (
              <button onClick={() => setRole("student")} className="hover:text-pine-dark transition-colors">
                {t("login.roleStudent")}
              </button>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
