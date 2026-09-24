import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { getStaffAccess } from "@/lib/staff";
import { eq } from "drizzle-orm";

// A batch admin may only touch students of their own batch.
async function batchAdminBlocked(access: { batch: string | null }, studentId: number): Promise<boolean> {
  if (!access.batch) return false;
  const [row] = await db.select({ batch: students.batch }).from(students).where(eq(students.id, studentId));
  return !row || row.batch !== access.batch;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await getStaffAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (await batchAdminBlocked(access, Number(id))) {
    return NextResponse.json({ error: "এই শিক্ষার্থী আপনার ব্যাচের নয়" }, { status: 403 });
  }
  const body = await req.json();
  const updateData: Record<string, unknown> = {};
  for (const field of ["roll", "name", "className", "section", "fatherName", "motherName", "phone", "address", "batch", "bloodGroup", "dateOfBirth", "approved"]) {
    if (body[field] !== undefined) updateData[field] = body[field];
  }
  // A batch admin cannot move a student to another batch.
  if (access.batch) updateData.batch = access.batch;
  if (body.password) {
    updateData.password = await hashPassword(body.password);
  }
  await db.update(students).set(updateData).where(eq(students.id, Number(id)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await getStaffAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (await batchAdminBlocked(access, Number(id))) {
    return NextResponse.json({ error: "এই শিক্ষার্থী আপনার ব্যাচের নয়" }, { status: 403 });
  }
  await db.delete(students).where(eq(students.id, Number(id)));
  return NextResponse.json({ ok: true });
}
