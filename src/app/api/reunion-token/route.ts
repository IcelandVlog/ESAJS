import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reunionTokens, students } from "@/db/schema";
import { getStaffAccess } from "@/lib/staff";
import { and, eq, gte, isNotNull } from "drizzle-orm";
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

// Sending SMS/emails to several batches at once can take a while.
export const maxDuration = 60;

type TokenFields = {
  occasion: string;
  messageBody: string;
  venue: string;
  reunionDate: Date;
};

type CreateResult =
  | { ok: true; saved: typeof reunionTokens.$inferSelect }
  | { ok: false; status: number; error: string };

// Creates one reunion token for one batch (with its own fee), and sends the join code
// to every approved member of that batch.
async function createTokenForBatch(batch: string, fields: TokenFields, feeAmount: number): Promise<CreateResult> {
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
    return { ok: false, status: 409, error: "আজ এই ব্যাচের জন্য ইতিমধ্যে একটি টোকেন তৈরি হয়েছে" };
  }

  const members = await db.select().from(students).where(and(eq(students.batch, batch), eq(students.approved, true)));
  if (members.length === 0) {
    return { ok: false, status: 400, error: "এই ব্যাচে কোনো অনুমোদিত সদস্য নেই" };
  }

  const token = randomToken();
  const dateStr = fields.reunionDate.toLocaleString("bn-BD", { dateStyle: "full", timeStyle: "short" });
  const message = [
    fields.occasion,
    fields.messageBody,
    `ব্যাচ: ${batch}`,
    `তারিখ: ${dateStr}`,
    fields.venue ? `স্থান: ${fields.venue}` : "",
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
        if (isEmailContact(contact)) emailSent++;
        else smsSent++;
      } else {
        failed++;
      }
    })
  );

  const [saved] = await db
    .insert(reunionTokens)
    .values({
      batch,
      occasion: fields.occasion,
      messageBody: fields.messageBody,
      venue: fields.venue,
      reunionDate: fields.reunionDate,
      feeAmount,
      token,
      recipientCount: members.length,
      smsSent,
      emailSent,
      failedCount: failed,
    })
    .returning();

  return { ok: true, saved };
}

const cleanFee = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));

export async function POST(req: NextRequest) {
  const access = await getStaffAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // `batch` is a batch year, or "all" (main admin only) to create one token per batch.
  // `feeAmount` is the default fee; `batchFees` optionally overrides it per batch year.
  const { batch, occasion, messageBody, venue, reunionDate, feeAmount, batchFees, excludeBatches } = (await req.json()) as {
    batch?: string;
    occasion?: string;
    messageBody?: string;
    venue?: string;
    reunionDate?: string;
    feeAmount?: number;
    batchFees?: Record<string, number | string | null>;
    excludeBatches?: string[]; // "all" only: batches to leave out of this reunion
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
  const reunionDateObj = reunionDate ? new Date(reunionDate) : null;
  if (!reunionDateObj || Number.isNaN(reunionDateObj.getTime())) {
    return NextResponse.json({ error: "রিইউনিয়নের তারিখ ও সময় দিন" }, { status: 400 });
  }
  const fields: TokenFields = {
    occasion: occasionText,
    messageBody: messageBody?.trim() || "",
    venue: venue?.trim() || "",
    reunionDate: reunionDateObj,
  };
  const defaultFee = cleanFee(feeAmount);

  if (batch !== "all") {
    const result = await createTokenForBatch(batch, fields, defaultFee);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ token: result.saved }, { status: 201 });
  }

  // ---- All batches (each gets its own token + its own fee) ----
  const batchRows = await db
    .selectDistinct({ batch: students.batch })
    .from(students)
    .where(and(eq(students.approved, true), isNotNull(students.batch)));
  const excluded = new Set((excludeBatches ?? []).map(String));
  const batches = batchRows.map((r) => r.batch as string).filter((b) => b && !excluded.has(b));
  if (batches.length === 0) {
    return NextResponse.json({ error: "অন্তত একটি ব্যাচ রাখুন — কোনো ব্যাচ বাছাই করা নেই" }, { status: 400 });
  }

  const created: (typeof reunionTokens.$inferSelect)[] = [];
  const skipped: { batch: string; error: string }[] = [];
  for (const b of batches) {
    const override = batchFees?.[b];
    const fee = override === undefined || override === null || override === "" ? defaultFee : cleanFee(override);
    const result = await createTokenForBatch(b, fields, fee);
    if (result.ok) created.push(result.saved);
    else skipped.push({ batch: b, error: result.error });
  }

  if (created.length === 0) {
    return NextResponse.json({ error: skipped[0]?.error || "কোনো টোকেন তৈরি হয়নি", skipped }, { status: 409 });
  }
  return NextResponse.json({ tokens: created, skipped }, { status: 201 });
}
