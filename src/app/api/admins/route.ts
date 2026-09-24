import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { admins } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { getMainAdmin, MAX_ADMINS_PER_BATCH } from "@/lib/staff";
import { NON_STUDENT_BATCH, PASSWORD_RULE, isValidBatch } from "@/lib/validation";

const USERNAME_RULE = /^[A-Za-z0-9_.-]{3,30}$/;

// Main admin only: list the batch admins (never returns password hashes).
export async function GET() {
  if (!(await getMainAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select({ id: admins.id, name: admins.name, username: admins.username, batch: admins.batch, createdAt: admins.createdAt })
    .from(admins)
    .where(isNotNull(admins.batch))
    .orderBy(desc(admins.batch), admins.id);
  return NextResponse.json({ admins: rows, maxPerBatch: MAX_ADMINS_PER_BATCH });
}

// Main admin only: create a batch admin (max 2 per batch).
export async function POST(req: NextRequest) {
  if (!(await getMainAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { name?: string; username?: string; password?: string; batch?: string };
  const name = body.name?.trim() || "";
  const username = body.username?.trim() || "";
  const password = body.password || "";
  const batch = body.batch?.trim() || "";

  if (!name || !username || !password || !batch) {
    return NextResponse.json({ error: "সব ফিল্ড পূরণ করুন" }, { status: 400 });
  }
  if (!isValidBatch(batch) || batch === NON_STUDENT_BATCH) {
    return NextResponse.json({ error: "সঠিক ব্যাচ (পাশের সাল) বাছাই করুন" }, { status: 400 });
  }
  if (!USERNAME_RULE.test(username)) {
    return NextResponse.json(
      { error: "ইউজারনেম ৩-৩০ অক্ষরের হতে হবে (ইংরেজি অক্ষর, সংখ্যা, _ . - ব্যবহার করা যাবে)" },
      { status: 400 }
    );
  }
  if (!PASSWORD_RULE.test(password)) {
    return NextResponse.json(
      { error: "পাসওয়ার্ড অন্তত ৬ অক্ষর, একটি বড় হাতের অক্ষর, একটি সংখ্যা ও একটি বিশেষ চিহ্ন থাকতে হবে" },
      { status: 400 }
    );
  }

  const [{ total }] = await db.select({ total: count() }).from(admins).where(and(eq(admins.batch, batch)));
  if (Number(total) >= MAX_ADMINS_PER_BATCH) {
    return NextResponse.json(
      { error: `এই ব্যাচের জন্য ইতিমধ্যে ${MAX_ADMINS_PER_BATCH} জন অ্যাডমিন আছেন` },
      { status: 409 }
    );
  }

  try {
    const [created] = await db
      .insert(admins)
      .values({ name, username, password: await hashPassword(password), batch })
      .returning({ id: admins.id, name: admins.name, username: admins.username, batch: admins.batch, createdAt: admins.createdAt });
    return NextResponse.json({ admin: created }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string })?.code === "23505") {
      return NextResponse.json({ error: "এই ইউজারনেমটি ইতিমধ্যে ব্যবহৃত হচ্ছে" }, { status: 409 });
    }
    console.error("CREATE BATCH ADMIN ERROR:", e);
    return NextResponse.json({ error: "সমস্যা হয়েছে, আবার চেষ্টা করুন" }, { status: 500 });
  }
}
