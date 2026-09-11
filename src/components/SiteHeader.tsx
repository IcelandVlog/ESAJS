import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="bg-pine text-paper border-b-4 border-gold">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-gold text-pine-dark flex items-center justify-center font-display text-lg font-semibold shrink-0">
            E
          </span>
          <span>
            <span className="block font-display text-lg leading-tight">
              Ex-Students Association of Jalalpur Secondary School
            </span>
            <span className="block text-xs tracking-wide text-paper/70">ESAS · জালালপুর মাধ্যমিক বিদ্যালয়</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="hover:text-gold transition-colors">
            হোম
          </Link>
          <Link href="/login" className="border border-paper/40 rounded px-4 py-2 hover:bg-gold hover:text-pine-dark hover:border-gold transition-colors">
            লগইন
          </Link>
        </nav>
      </div>
    </header>
  );
}
