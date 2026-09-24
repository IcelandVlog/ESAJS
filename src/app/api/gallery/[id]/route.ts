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

const MAX_IMAGE_DATA_URL_LENGTH = 1_500_000;
const MAX_CONTENT_LENGTH = 20_000;

// Admin edits a gallery item. The image is optional — omit it to keep the current one.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { imageUrl, content } = (await req.json()) as { imageUrl?: string; content?: string };

  if (!content || content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: "বিস্তারিত তথ্য সঠিক নয়" }, { status: 400 });
  }
  const changes: { content: string; imageUrl?: string } = { content };
  if (imageUrl) {
    if (!imageUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "সঠিক ছবি দিন" }, { status: 400 });
    }
    if (imageUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
      return NextResponse.json({ error: "ছবির সাইজ অনেক বড়, আরেকটু ছোট ছবি দিন" }, { status: 400 });
    }
    changes.imageUrl = imageUrl;
  }

  const updated = await db.update(galleryPhotos).set(changes).where(eq(galleryPhotos.id, Number(id))).returning();
  if (updated.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ photo: updated[0] });
}
