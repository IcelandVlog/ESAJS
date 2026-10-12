import Link from "next/link";
import type { ReactNode } from "react";

export const LEGAL_EMAIL = "esajs.official@gmail.com";

export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 w-full">
      <Link href="/" className="text-sm underline text-ink/70">
        ← ESAJS
      </Link>
      <h1 className="text-3xl font-semibold mt-4 mb-2">{title}</h1>
      <p className="text-sm text-ink/60 mb-8">Ex-Students Association of Jalalpur Secondary School (ESAJS)</p>
      <div className="space-y-4 leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:underline">
        {children}
      </div>
    </main>
  );
}
