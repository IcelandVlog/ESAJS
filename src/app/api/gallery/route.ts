import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { galleryPhotos } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { desc } from "drizzle-orm";

const MAX_IMAGE_DATA_URL_LENGTH = 1_500_000; // ~1.1MB image after base64 overhead
const MAX_CONTENT_LENGTH = 20_000; // header + detail lines JSON

// Public — anyone visiting the homepage can view the gallery
export async function GET() {
  const rows = await db.select().from(galleryPhotos).orderBy(desc(galleryPhotos.id));
  return NextResponse.json({ photos: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { imageUrl, content } = body as { imageUrl?: string; content?: string };

  if (!imageUrl || !imageUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "সঠিক ছবি দিন" }, { status: 400 });
  }
  if (imageUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
    return NextResponse.json({ error: "ছবির সাইজ অনেক বড়, আরেকটু ছোট ছবি দিন" }, { status: 400 });
  }
  if (!content || content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: "বিস্তারিত তথ্য সঠিক নয়" }, { status: 400 });
  }

  const inserted = await db.insert(galleryPhotos).values({ imageUrl, content }).returning();
  return NextResponse.json({ photo: inserted[0] }, { status: 201 });
}
