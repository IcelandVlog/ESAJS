import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { notices } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.delete(notices).where(eq(notices.id, Number(id)));
  return NextResponse.json({ ok: true });
}

// Admin edits an existing notice.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { title, content, date } = (await req.json()) as { title?: string; content?: string; date?: string };
  if (!title?.trim() || !content?.trim() || !date) {
    return NextResponse.json({ error: "সব ফিল্ড আবশ্যক" }, { status: 400 });
  }
  const updated = await db
    .update(notices)
    .set({ title: title.trim(), content: content.trim(), date })
    .where(eq(notices.id, Number(id)))
    .returning();
  if (updated.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ notice: updated[0] });
}
