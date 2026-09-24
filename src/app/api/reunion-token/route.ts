import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionTokens, students } from "@/db/schema";
import { getStaffAccess } from "@/lib/staff";
import { and, eq, gte } from "drizzle-orm";
import { sendEmailMessage, sendSmsMessage, isEmailContact, resolveContact } from "@/lib/messaging";

function randomToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function GET() {
  const access = await getStaffAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = access.batch
    ? await db.select().from(reunionTokens).where(eq(reunionTokens.batch, access.batch)).orderBy(reunionTokens.id)
    : await db.select().from(reunionTokens).orderBy(reunionTokens.id);
  return NextResponse.json({ tokens: rows.reverse() });
}

export async function POST(req: NextRequest) {
  const access = await getStaffAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { batch, occasion, messageBody, venue, reunionDate } = (await req.json()) as {
    batch?: string;
    occasion?: string;
    messageBody?: string;
    venue?: string;
    reunionDate?: string;
  };
  if (!batch) {
    return NextResponse.json({ error: "ব্যাচ বাছাই করুন" }, { status: 400 });
  }
  if (access.batch && batch !== access.batch) {
    return NextResponse.json({ error: "আপনি শুধু নিজের ব্যাচের জন্য রিইউনিয়ন তৈরি করতে পারবেন" }, { status: 403 });
  }
  const occasionText = occasion?.trim();
  if (!occasionText) {
    return NextResponse.json({ error: "উপলক্ষ লিখুন" }, { status: 400 });
  }
  const messageBodyText = messageBody?.trim() || "";
  const venueText = venue?.trim() || "";
  const reunionDateObj = reunionDate ? new Date(reunionDate) : null;
  if (!reunionDateObj || Number.isNaN(reunionDateObj.getTime())) {
    return NextResponse.json({ error: "রিইউনিয়নের তারিখ ও সময় দিন" }, { status: 400 });
  }

  // One active (non-cancelled) token per batch per calendar day.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const existing = await db
    .select()
    .from(reunionTokens)
    .where(
      and(eq(reunionTokens.batch, batch), gte(reunionTokens.createdAt, startOfToday), eq(reunionTokens.cancelled, false))
    );
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "আজ এই ব্যাচের জন্য ইতিমধ্যে একটি টোকেন তৈরি হয়েছে" },
      { status: 409 }
    );
  }

  const members = await db.select().from(students).where(and(eq(students.batch, batch), eq(students.approved, true)));
  if (members.length === 0) {
    return NextResponse.json({ error: "এই ব্যাচে কোনো অনুমোদিত সদস্য নেই" }, { status: 400 });
  }

  const token = randomToken();
  const dateStr = reunionDateObj.toLocaleString("bn-BD", { dateStyle: "full", timeStyle: "short" });
  const message = [
    occasionText,
    messageBodyText,
    `ব্যাচ: ${batch}`,
    `তারিখ: ${dateStr}`,
    venueText ? `স্থান: ${venueText}` : "",
    `জয়েন কোড: ${token}`,
  ]
    .filter(Boolean)
    .join("\n");

  let smsSent = 0;
  let emailSent = 0;
  let failed = 0;

  await Promise.all(
    members.map(async (m) => {
      const contact = resolveContact(m.roll, m.phone);
      if (!contact) {
        failed++;
        return;
      }
      const ok = isEmailContact(contact)
        ? await sendEmailMessage(contact, "ESAJS Reunion Join Code", message)
        : await sendSmsMessage(contact, message);
      if (ok) {
        isEmailContact(contact) ? emailSent++ : smsSent++;
      } else {
        failed++;
      }
    })
  );

  const [saved] = await db
    .insert(reunionTokens)
    .values({
      batch,
      occasion: occasionText,
      messageBody: messageBodyText,
      venue: venueText,
      reunionDate: reunionDateObj,
      token,
      recipientCount: members.length,
      smsSent,
      emailSent,
      failedCount: failed,
    })
    .returning();

  return NextResponse.json({ token: saved }, { status: 201 });
}
