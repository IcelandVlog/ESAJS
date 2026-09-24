import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { admins } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { getMainAdmin } from "@/lib/staff";
import { PASSWORD_RULE } from "@/lib/validation";

// Both handlers only ever touch batch admins (batch IS NOT NULL) — the main admin
// account can't be edited or removed from here.

// Main admin: rename a batch admin and/or set a new password for them.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getMainAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json()) as { name?: string; password?: string };
  const updates: { name?: string; password?: string } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "নাম খালি রাখা যাবে না" }, { status: 400 });
    updates.name = name;
  }
  if (body.password) {
    if (!PASSWORD_RULE.test(body.password)) {
      return NextResponse.json(
        { error: "পাসওয়ার্ড অন্তত ৬ অক্ষর, একটি বড় হাতের অক্ষর, একটি সংখ্যা ও একটি বিশেষ চিহ্ন থাকতে হবে" },
        { status: 400 }
      );
    }
    updates.password = await hashPassword(body.password);
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "কিছু পরিবর্তন করার জন্য দিন" }, { status: 400 });
  }

  const updated = await db
    .update(admins)
    .set(updates)
    .where(and(eq(admins.id, Number(id)), isNotNull(admins.batch)))
    .returning({ id: admins.id });
  if (updated.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// Main admin: remove a batch admin. Their access ends immediately (every admin
// request re-checks the admins table).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getMainAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const deleted = await db
    .delete(admins)
    .where(and(eq(admins.id, Number(id)), isNotNull(admins.batch)))
    .returning({ id: admins.id });
  if (deleted.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
