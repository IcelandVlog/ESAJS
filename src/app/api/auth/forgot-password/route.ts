import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmailMessage, sendSmsMessage, isEmailContact } from "@/lib/messaging";

function randomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit numeric OTP
}

// Masks a phone/email so the response can confirm where the code went
// without revealing the full contact to whoever is at the login screen.
function maskContact(value: string): string {
  if (isEmailContact(value)) {
    const [user, domain] = value.split("@");
    const visible = user.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(user.length - 2, 1))}@${domain}`;
  }
  return value.length > 4 ? `${"*".repeat(value.length - 4)}${value.slice(-4)}` : value;
}

export async function POST(req: NextRequest) {
  const { roll, batch } = (await req.json()) as { roll?: string; batch?: string };
  if (!roll || !batch) {
    return NextResponse.json({ error: "রোল ও ব্যাচ দিন" }, { status: 400 });
  }

  const [student] = await db.select().from(students).where(eq(students.roll, roll.trim()));
  // Same generic error whether the roll doesn't exist or the batch doesn't match,
  // so this endpoint can't be used to probe which rolls exist.
  const genericError = () => NextResponse.json({ error: "রোল বা ব্যাচ মিলছে না" }, { status: 400 });
  if (!student || (student.batch || "") !== batch.trim()) {
    return genericError();
  }

  const contact = student.phone?.trim();
  if (!contact) {
    return NextResponse.json(
      { error: "আপনার প্রোফাইলে কোনো ফোন/ইমেইল নেই। অ্যাডমিনের সাথে যোগাযোগ করুন।" },
      { status: 400 }
    );
  }

  const code = randomCode();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await db.update(students).set({ resetCode: code, resetCodeExpires: expires }).where(eq(students.id, student.id));

  const message = `ESAJS পাসওয়ার্ড রিসেট কোড: ${code}\nএই কোডটি ১৫ মিনিটের জন্য কার্যকর। আপনি অনুরোধ না করলে এই মেসেজ উপেক্ষা করুন।`;
  const sent = isEmailContact(contact)
    ? await sendEmailMessage(contact, "ESAJS Password Reset Code", message)
    : await sendSmsMessage(contact, message);

  if (!sent) {
    return NextResponse.json(
      { error: "কোড পাঠাতে ব্যর্থ হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন অথবা অ্যাডমিনের সাথে যোগাযোগ করুন।" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, maskedContact: maskContact(contact) });
}
