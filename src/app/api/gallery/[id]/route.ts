import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { galleryPhotos } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.delete(galleryPhotos).where(eq(galleryPhotos.id, Number(id)));
  return NextResponse.json({ ok: true });
}
