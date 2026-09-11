"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "student">("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        setError(data.error || "লগইন ব্যর্থ হয়েছে");
        setLoading(false);
        return;
      }
      router.push(role === "admin" ? "/admin" : "/student");
      router.refresh();
    } catch {
      setError("নেটওয়ার্ক সমস্যা হয়েছে");
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-16 bg-paper">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl text-pine-dark mb-2 text-center">লগইন করুন</h1>
          <p className="text-center text-ink/60 text-sm mb-8">
            আপনি কি হিসেবে প্রবেশ করছেন তা বেছে নিন
          </p>

          <div className="flex mb-6 border border-line rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                role === "student" ? "bg-pine text-paper" : "bg-white text-ink/70"
              }`}
            >
              শিক্ষার্থী
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                role === "admin" ? "bg-pine text-paper" : "bg-white text-ink/70"
              }`}
            >
              অ্যাডমিন
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-line rounded-lg p-6">
            <div>
              <label className="block text-sm text-ink/70 mb-1.5">
                {role === "student" ? "রোল নাম্বার" : "ইউজারনেম"}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full border border-line rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pine/40"
                placeholder={role === "student" ? "যেমনঃ 101" : "যেমনঃ admin"}
              />
            </div>
            <div>
              <label className="block text-sm text-ink/70 mb-1.5">পাসওয়ার্ড</label>
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
              {loading ? "লগইন হচ্ছে..." : "লগইন"}
            </button>
          </form>

          <p className="text-xs text-ink/40 text-center mt-6">
            ডেমো — শিক্ষার্থী: roll 101 / student123 &nbsp;•&nbsp; অ্যাডমিন: admin / admin123
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
