# Ex-Students Association of Jalalpur Secondary School (ESAJS) — Website (Next.js + Database)

একটি সম্পূর্ণ ডাইনামিক স্কুল ওয়েবসাইট, ডাটাবেসসহ। এতে আছে:

- **পাবলিক হোমপেজ** — নোটিশ বোর্ড, সবাই দেখতে পারবে
- **অ্যাডমিন প্যানেল** (লগইন প্রয়োজন) — শিক্ষার্থী, রেজাল্ট, নোটিশ, অ্যাটেনডেন্স যোগ/সম্পাদনা/মুছে ফেলা
- **স্টুডেন্ট পোর্টাল** (লগইন প্রয়োজন) — নিজের রোল দিয়ে লগইন করে নিজের রেজাল্ট ও অ্যাটেনডেন্স দেখা

## টেকনোলজি

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Drizzle ORM** + **libSQL/SQLite** ডাটাবেস — লোকালি একটি ফাইল (`school.db`), প্রোডাকশনে বিনামূল্যে **Turso** ক্লাউড ডাটাবেস (SQLite-compatible, Vercel-এর সাথে নিখুঁতভাবে কাজ করে)
- JWT + httpOnly cookie ভিত্তিক লগইন (অ্যাডমিন ও স্টুডেন্ট আলাদা রোল), পাসওয়ার্ড bcrypt দিয়ে হ্যাশ করা

## ডেমো লগইন (seed data)

| রোল | ইউজারনেম/রোল | পাসওয়ার্ড |
|---|---|---|
| অ্যাডমিন | `admin` | `admin123` |
| শিক্ষার্থী | `101` | `student123` |

⚠️ **প্রোডাকশনে দেওয়ার আগে এই ডিফল্ট পাসওয়ার্ডগুলো অবশ্যই পরিবর্তন করুন।**

---

## ১. নিজের কম্পিউটারে চালানো (Local Setup)

প্রয়োজন: [Node.js](https://nodejs.org) ১৮ বা তার উপরে।

```bash
# ১. ডিপেন্ডেন্সি ইনস্টল করুন
npm install

# ২. ডাটাবেস স্কিমা তৈরি করুন (school.db ফাইল তৈরি হবে)
npm run db:push

# ৩. ডেমো ডাটা যোগ করুন (admin + sample student + notice)
npm run db:seed

# ৪. ডেভেলপমেন্ট সার্ভার চালু করুন
npm run dev
```

এরপর ব্রাউজারে খুলুন: **http://localhost:3000**

ডাটাবেস ব্রাউজ করে দেখতে চাইলে: `npm run db:studio`

---

## ২. Vercel-এ হোস্ট করা (Deployment)

লোকাল SQLite ফাইল (`school.db`) Vercel-এর সার্ভারলেস এনভায়রনমেন্টে persist করে না। তাই প্রোডাকশনে ব্যবহার করতে হবে **Turso** — SQLite-compatible একটি cloud database, ফ্রি টায়ারে পাওয়া যায়, কোড প্রায় একই থাকে।

### ধাপ ১ — GitHub-এ কোড পুশ করুন

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### ধাপ ২ — একটি ফ্রি Turso ডাটাবেস তৈরি করুন

1. https://turso.tech -এ গিয়ে ফ্রি অ্যাকাউন্ট খুলুন
2. Turso CLI ইনস্টল করুন অথবা তাদের ড্যাশবোর্ড থেকে সরাসরি একটি ডাটাবেস তৈরি করুন
3. ডাটাবেস তৈরি হলে দুটি জিনিস পাবেন:
   - **Database URL** (এরকম: `libsql://your-db-name.turso.io`)
   - **Auth Token** (একটি লম্বা সিক্রেট স্ট্রিং)

CLI দিয়ে করলে:
```bash
turso db create school-website
turso db show school-website --url
turso auth token create school-website
```

### ধাপ ৩ — Turso ডাটাবেসে স্কিমা পুশ করুন

লোকাল টার্মিনালে env var হিসেবে বসিয়ে:

```bash
TURSO_DATABASE_URL="libsql://your-db-name.turso.io" TURSO_AUTH_TOKEN="your-token" npm run db:push
TURSO_DATABASE_URL="libsql://your-db-name.turso.io" TURSO_AUTH_TOKEN="your-token" npm run db:seed
```

### ধাপ ৪ — Vercel-এ ইমপোর্ট করুন

1. https://vercel.com -এ গিয়ে "Add New Project" → আপনার GitHub রিপো সিলেক্ট করুন
2. **Environment Variables** সেকশনে যোগ করুন:
   - `TURSO_DATABASE_URL` = আপনার Turso database URL
   - `TURSO_AUTH_TOKEN` = আপনার Turso auth token
   - `JWT_SECRET` = যেকোনো লম্বা র‍্যান্ডম স্ট্রিং (না দিলে একটি ডিফল্ট ভ্যালু ব্যবহৃত হবে, যা প্রোডাকশনের জন্য নিরাপদ নয়)
3. **Deploy** চাপুন

ব্যস! কিছুক্ষণের মধ্যে ওয়েবসাইট লাইভ হয়ে যাবে, এবং Turso-তে সংরক্ষিত ডাটা প্রতিটি ভিজিটের সাথে persist থাকবে।

---

## প্রজেক্ট স্ট্রাকচার

```
src/
  db/
    schema.ts        # ডাটাবেস টেবিল (students, admins, results, notices, attendance)
    client.ts         # ডাটাবেস কানেকশন (local file অথবা Turso)
    seed.ts             # ডেমো ডাটা তৈরির স্ক্রিপ্ট
  lib/
    auth.ts              # JWT সেশন, পাসওয়ার্ড হ্যাশিং
  app/
    page.tsx               # পাবলিক হোমপেজ (নোটিশ বোর্ড)
    login/page.tsx           # লগইন পেজ (admin/student toggle)
    admin/                     # অ্যাডমিন ড্যাশবোর্ড
    student/page.tsx            # স্টুডেন্ট ড্যাশবোর্ড
    api/                          # সব API রুট (students, results, notices, attendance, auth)
```

## নতুন ফিচার যোগ করতে চাইলে

- `src/db/schema.ts` -এ নতুন টেবিল/কলাম যোগ করুন, তারপর `npm run db:push`
- নতুন API রুট `src/app/api/...` ফোল্ডারে যোগ করুন
- UI `src/app/admin/AdminDashboard.tsx` অথবা `src/app/student/page.tsx` -এ পরিবর্তন করুন
