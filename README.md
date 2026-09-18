# Ex-Students Association of Jalalpur Secondary School (ESAJS) — Website (Next.js + Database)

একটি সম্পূর্ণ ডাইনামিক স্কুল ওয়েবসাইট, ডাটাবেসসহ। এতে আছে:

- **পাবলিক হোমপেজ** — নোটিশ বোর্ড, সবাই দেখতে পারবে
- **অ্যাডমিন প্যানেল** (লগইন প্রয়োজন) — শিক্ষার্থী, রেজাল্ট, নোটিশ, অ্যাটেনডেন্স যোগ/সম্পাদনা/মুছে ফেলা
- **স্টুডেন্ট পোর্টাল** (লগইন প্রয়োজন) — নিজের রোল দিয়ে লগইন করে নিজের রেজাল্ট ও অ্যাটেনডেন্স দেখা

## টেকনোলজি

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Drizzle ORM** + **Supabase (Postgres)** ডাটাবেস — লোকাল এবং প্রোডাকশন দুই জায়গাতেই একই Supabase ডাটাবেস ব্যবহার হয়
- JWT + httpOnly cookie ভিত্তিক লগইন (অ্যাডমিন ও স্টুডেন্ট আলাদা রোল), পাসওয়ার্ড bcrypt দিয়ে হ্যাশ করা

## ডেমো লগইন (seed data)

| রোল | ইউজারনেম/রোল | পাসওয়ার্ড |
|---|---|---|
| অ্যাডমিন | `admin` | `admin123` |
| শিক্ষার্থী | `101` | `student123` |

⚠️ **প্রোডাকশনে দেওয়ার আগে এই ডিফল্ট পাসওয়ার্ডগুলো অবশ্যই পরিবর্তন করুন।**

---

## ০. একটি ফ্রি Supabase প্রজেক্ট তৈরি করুন

1. https://supabase.com -এ গিয়ে ফ্রি অ্যাকাউন্ট খুলুন এবং একটি নতুন প্রজেক্ট বানান
2. প্রজেক্ট তৈরি হলে: **Project Settings → Database → Connection string → URI** থেকে কানেকশন স্ট্রিং কপি করুন
   - Vercel/সার্ভারলেসের জন্য **Transaction pooler** (পোর্ট `6543`) ব্যবহার করুন
   - `[YOUR-PASSWORD]` জায়গায় আপনার ডাটাবেস পাসওয়ার্ড বসান
3. প্রজেক্ট রুটে `.env` ফাইল বানিয়ে (`.env.example` কপি করে) তাতে বসান:

```bash
DATABASE_URL="postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-xx-xxxx-1.pooler.supabase.com:6543/postgres"
JWT_SECRET="যেকোনো লম্বা র‍্যান্ডম স্ট্রিং"
```

---

## ১. নিজের কম্পিউটারে চালানো (Local Setup)

প্রয়োজন: [Node.js](https://nodejs.org) ১৮ বা তার উপরে, এবং উপরের ধাপ ০ অনুযায়ী `.env` ফাইল।

```bash
# ১. ডিপেন্ডেন্সি ইনস্টল করুন
npm install

# ২. Supabase ডাটাবেসে স্কিমা (টেবিলগুলো) পুশ করুন
npm run db:push

# ৩. ডেমো ডাটা যোগ করুন (admin + sample student + notice)
npm run db:seed

# ৪. ডেভেলপমেন্ট সার্ভার চালু করুন
npm run dev
```

এরপর ব্রাউজারে খুলুন: **http://localhost:3000**

ডাটাবেস ব্রাউজ করে দেখতে চাইলে: `npm run db:studio`, অথবা সরাসরি Supabase ড্যাশবোর্ডের **Table Editor**-এ।

---

## ২. Vercel-এ হোস্ট করা (Deployment)

যেহেতু ডাটাবেস এখন Supabase-এ (ক্লাউডে), স্থানীয় ফাইলের কোনো persist সমস্যা নেই — একই `DATABASE_URL` লোকাল এবং প্রোডাকশন দুই জায়গাতেই কাজ করবে।

### ধাপ ১ — GitHub-এ কোড পুশ করুন

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### ধাপ ২ — Vercel-এ ইমপোর্ট করুন

1. https://vercel.com -এ গিয়ে "Add New Project" → আপনার GitHub রিপো সিলেক্ট করুন
2. **Environment Variables** সেকশনে যোগ করুন:
   - `DATABASE_URL` = আপনার Supabase Postgres কানেকশন স্ট্রিং (Transaction pooler, পোর্ট 6543)
   - `JWT_SECRET` = যেকোনো লম্বা র‍্যান্ডম স্ট্রিং (না দিলে একটি ডিফল্ট ভ্যালু ব্যবহৃত হবে, যা প্রোডাকশনের জন্য নিরাপদ নয়)
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` ও `RECAPTCHA_SECRET_KEY` = আপনার লোকাল `.env` ফাইলে যে reCAPTCHA কী আছে, ঠিক সেগুলোই। এই দুটো `.env` ফাইলে থাকলেও `.env` গিটে পুশ হয় না (gitignore করা), তাই Vercel-এ আলাদাভাবে যোগ না করলে লাইভ সাইটে "reCAPTCHA not configured yet" দেখাবে।
   - ⚠️ `NEXT_PUBLIC_` দিয়ে শুরু হওয়া ভ্যারিয়েবল বিল্ড-টাইমে কোডের ভেতর বসে যায় (রানটাইমে না) — তাই এই ভ্যারিয়েবল যোগ/পরিবর্তনের পর অবশ্যই Vercel-এ নতুন করে **Redeploy** করতে হবে, নাহলে পুরনো বিল্ডই লাইভ থেকে যাবে।
3. **Deploy** চাপুন

ব্যস! কিছুক্ষণের মধ্যে ওয়েবসাইট লাইভ হয়ে যাবে, এবং Supabase-এ সংরক্ষিত ডাটা প্রতিটি ভিজিটের সাথে persist থাকবে।

---

## প্রোফাইল ছবি ফিচার — একবার db:push করে নিন

প্রোফাইল পেজ থেকে ছবি আপলোডের ফিচার যোগ হয়েছে (`students`/`admins` টেবিলে নতুন `photo_url` কলাম)। এটা লাইভ হওয়ার আগে একবার লোকাল মেশিন থেকে চালান, যাতে Supabase ডাটাবেসেও নতুন কলামটা যোগ হয়:

```bash
npm run db:push
```

(লোকাল `.env`-এর `DATABASE_URL` যেহেতু একই Supabase ডাটাবেসে কানেক্ট করে, তাই এটা লোকাল আর প্রোডাকশন দুই জায়গার জন্যই যথেষ্ট — আলাদা করে Vercel-এ কিছু চালাতে হবে না।)

---

## গ্যালারি ফিচার — নতুন টেবিল যোগ করুন

হোম পেজে নোটিশ বোর্ডের আগে একটা গ্যালারি সেকশন যোগ হয়েছে (অ্যাডমিন প্যানেল থেকে ছবি ও বিস্তারিত তথ্য আপলোড করা যায়)। এর জন্য নতুন `gallery_photos` টেবিল লাগবে।

`npm run db:push` এই প্রজেক্টে মাঝেমধ্যে একটা পরিচিত `drizzle-kit` বাগের কারণে ক্র্যাশ করে (উপরে প্রোফাইল-ছবি ফিচারেও একই সমস্যা হয়েছিল) — তাই সরাসরি Supabase-এর **SQL Editor**-এ গিয়ে এই SQL কোডটা চালিয়ে নিন:

```sql
CREATE TABLE IF NOT EXISTS gallery_photos (
  id serial PRIMARY KEY,
  image_url text NOT NULL,
  content text NOT NULL DEFAULT '{}',
  created_at timestamp DEFAULT now()
);
```

---

## রেজিস্ট্রেশনে ব্লাড গ্রুপ — নতুন কলাম যোগ করুন

রেজিস্ট্রেশন ফর্মে (ও অ্যাডমিন প্যানেলের স্টুডেন্ট ফর্মে) একটা ঐচ্ছিক "ব্লাড গ্রুপ" ফিল্ড যোগ হয়েছে। এর জন্য `students` টেবিলে নতুন `blood_group` কলাম লাগবে — একইভাবে Supabase SQL Editor-এ চালান:

```sql
ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_group text;
```

---

## রিইউনিয়ন টোকেন — নতুন টেবিল ও এনভায়রনমেন্ট ভ্যারিয়েবল লাগবে

হোম পেজের "REUNION CARD" বাটন-সংশ্লিষ্ট ফিচার হিসেবে অ্যাডমিন প্যানেলে একটা নতুন "রিইউনিয়ন" ট্যাব যোগ হয়েছে — এখান থেকে প্রতিটা ব্যাচের জন্য দিনে একবার একটা এন্ট্রি কোড (টোকেন) তৈরি করা যায়, যেটা ব্যাচের সব অনুমোদিত সদস্যের কন্টাক্টে (SMS অথবা ইমেইল, যেটা যার কাছে আছে) স্বয়ংক্রিয়ভাবে পাঠিয়ে দেওয়া হয়।

### ১. নতুন টেবিল

Supabase SQL Editor-এ চালান:

```sql
CREATE TABLE IF NOT EXISTS reunion_tokens (
  id serial PRIMARY KEY,
  batch text NOT NULL,
  token text NOT NULL,
  recipient_count integer NOT NULL DEFAULT 0,
  sms_sent integer NOT NULL DEFAULT 0,
  email_sent integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now()
);
```

### ২. ইমেইল পাঠানোর জন্য (Gmail)

Vercel-এর Environment Variables-এ যোগ করুন:
- `GMAIL_USER` = `esajs.official@gmail.com`
- `GMAIL_APP_PASSWORD` = Google-এর "App Password" (এটা সাধারণ Gmail পাসওয়ার্ড না!)

App Password বানানোর ধাপ:
1. esajs.official@gmail.com দিয়ে গুগল অ্যাকাউন্টে লগইন করুন
2. আগে **2-Step Verification** চালু করতে হবে (myaccount.google.com/security থেকে), তা না হলে App Password অপশনটাই দেখাবে না
3. myaccount.google.com/apppasswords-এ গিয়ে একটা নতুন App Password তৈরি করুন (নাম যা খুশি দিন, যেমন "ESAJS Website")
4. ১৬-অক্ষরের যে কোডটা দেখাবে (স্পেস বাদে), সেটাই `GMAIL_APP_PASSWORD`

### ৩. SMS পাঠানোর জন্য

এই কোড যেকোনো SMS গেটওয়ের সাথে কাজ করার জন্য বানানো — যে গেটওয়ে ব্যবহার করবেন তার ডকুমেন্টেশন থেকে API URL ফরম্যাট নিয়ে বসিয়ে দিতে হবে। Vercel-এ যোগ করুন:
- `SMS_API_URL` — আপনার গেটওয়ের API URL, এই ৪টা প্লেসহোল্ডার রেখে: `{API_KEY}`, `{NUMBER}`, `{MESSAGE}`, `{SENDER_ID}`
- `SMS_API_KEY` — আপনার গেটওয়ের API কী
- `SMS_SENDER_ID` — আপনার গেটওয়ের Sender ID (না থাকলে খালি রাখুন)

উদাহরণ (BulkSMSBD গেটওয়ে ব্যবহার করলে):
```
SMS_API_URL=http://bulksmsbd.net/api/smsapi?api_key={API_KEY}&type=text&number={NUMBER}&senderid={SENDER_ID}&message={MESSAGE}
```

আপনি যদি অন্য কোনো গেটওয়ে ব্যবহার করেন (Alpha SMS, Elit BD, ইত্যাদি), তাদের ডকুমেন্টেশনের URL ফরম্যাট আমাকে দিলে সেটাও ঠিক করে দিতে পারি।

⚠️ **`GMAIL_USER`/`GMAIL_APP_PASSWORD` বা `SMS_API_URL`/`SMS_API_KEY` কনফিগার না করা থাকলে** — টোকেন তৈরি হবে ও হিস্ট্রিতে দেখাবে, কিন্তু কারো কাছে SMS/ইমেইল পাঠানো হবে না (কোনো এরর ছাড়াই চুপচাপ স্কিপ হয়ে যাবে)।

---

## প্রজেক্ট স্ট্রাকচার

```
src/
  db/
    schema.ts        # ডাটাবেস টেবিল (students, admins, results, notices, attendance)
    client.ts         # ডাটাবেস কানেকশন (Supabase Postgres)
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
