import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { db } from "@/db/client";
import { notices } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allNotices = await db.select().from(notices).orderBy(desc(notices.id));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-pine text-paper">
          <div className="max-w-5xl mx-auto px-6 py-16 grid gap-8 sm:grid-cols-[1.3fr_1fr] items-center">
            <div>
              <p className="text-gold tracking-wide text-sm mb-3">ESAS</p>
              <h1 className="font-display text-4xl sm:text-5xl leading-tight mb-4">
                Ex-Students Association of Jalalpur Secondary School
              </h1>
              <p className="text-paper/80 max-w-md leading-relaxed">
                নোটিশ, রেজাল্ট ও সদস্য তথ্য — সবকিছু এখন এক জায়গায়। প্রাক্তন শিক্ষার্থীরা নিজের
                রোল দিয়ে লগইন করে নিজের তথ্য দেখতে পারবে, আর প্রশাসন সহজে সব পরিচালনা করতে পারবে।
              </p>
              <Link
                href="/login"
                className="inline-block mt-6 bg-gold text-pine-dark px-6 py-3 rounded font-medium hover:bg-paper transition-colors"
              >
                লগইন করুন
              </Link>
            </div>
            <div className="border border-paper/20 rounded-lg p-6 bg-pine-dark/40">
              <dl className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <dt className="font-display text-3xl text-gold">৪০+</dt>
                  <dd className="text-sm text-paper/70 mt-1">বছরের ঐতিহ্য</dd>
                </div>
                <div>
                  <dt className="font-display text-3xl text-gold">১২০০+</dt>
                  <dd className="text-sm text-paper/70 mt-1">প্রাক্তন শিক্ষার্থী</dd>
                </div>
                <div>
                  <dt className="font-display text-3xl text-gold">৬০+</dt>
                  <dd className="text-sm text-paper/70 mt-1">সক্রিয় সদস্য</dd>
                </div>
                <div>
                  <dt className="font-display text-3xl text-gold">২০+</dt>
                  <dd className="text-sm text-paper/70 mt-1">ব্যাচ</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-14">
          <div className="flex items-baseline justify-between mb-6 border-b border-line pb-3">
            <h2 className="font-display text-2xl text-pine-dark">নোটিশ বোর্ড</h2>
            <span className="text-sm text-ink/50">{allNotices.length} টি নোটিশ</span>
          </div>

          {allNotices.length === 0 ? (
            <p className="text-ink/60 py-10 text-center">এখনো কোনো নোটিশ যুক্ত করা হয়নি।</p>
          ) : (
            <ul className="space-y-4">
              {allNotices.map((n) => (
                <li key={n.id} className="border border-line rounded-lg p-5 bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-medium text-lg text-pine-dark">{n.title}</h3>
                    <time className="text-xs text-ink/50 whitespace-nowrap mt-1">{n.date}</time>
                  </div>
                  <p className="text-ink/70 mt-2 leading-relaxed whitespace-pre-line">{n.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
