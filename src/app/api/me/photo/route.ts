import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { admins, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// Photos are stored as base64 data URLs directly in the database — no extra
// file storage service to configure. Keep a hard cap so a single upload
// can't bloat the database; the client resizes/compresses before sending,
// this is just a server-side backstop.
const MAX_DATA_URL_LENGTH = 400_000; // ~300KB image after base64 overhead

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "লগইন প্রয়োজন" }, { status: 401 });
  }

  const body = await req.json();
  const { photoUrl } = body as { photoUrl?: string };

  if (!photoUrl || !photoUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "সঠিক ছবি দিন" }, { status: 400 });
  }
  if (photoUrl.length > MAX_DATA_URL_LENGTH) {
    return NextResponse.json({ error: "ছবির সাইজ অনেক বড়, আরেকটু ছোট ছবি দিন" }, { status: 400 });
  }

  const table = session.role === "admin" ? admins : students;
  await db.update(table).set({ photoUrl }).where(eq(table.id, session.id));

  return NextResponse.json({ ok: true, photoUrl });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "লগইন প্রয়োজন" }, { status: 401 });
  }

  const table = session.role === "admin" ? admins : students;
  await db.update(table).set({ photoUrl: null }).where(eq(table.id, session.id));

  return NextResponse.json({ ok: true });
}
