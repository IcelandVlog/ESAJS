import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const updateData: Record<string, unknown> = {};
  for (const field of ["roll", "name", "className", "section", "fatherName", "motherName", "phone", "address", "batch", "approved"]) {
    if (body[field] !== undefined) updateData[field] = body[field];
  }
  if (body.password) {
    updateData.password = await hashPassword(body.password);
  }
  await db.update(students).set(updateData).where(eq(students.id, Number(id)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.delete(students).where(eq(students.id, Number(id)));
  return NextResponse.json({ ok: true });
}
