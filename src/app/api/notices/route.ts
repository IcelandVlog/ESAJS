import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { notices } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { desc } from "drizzle-orm";

// Public — anyone visiting the homepage can read notices
export async function GET() {
  const rows = await db.select().from(notices).orderBy(desc(notices.id));
  return NextResponse.json({ notices: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { title, content, date } = body;
  if (!title || !content || !date) {
    return NextResponse.json({ error: "সব ফিল্ড আবশ্যক" }, { status: 400 });
  }
  const inserted = await db.insert(notices).values({ title, content, date }).returning();
  return NextResponse.json({ notice: inserted[0] }, { status: 201 });
}
