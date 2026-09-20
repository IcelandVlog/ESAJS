import nodemailer from "nodemailer";

// ---------- Email (Gmail SMTP) ----------
// Requires GMAIL_USER (the sending address, e.g. esajs.official@gmail.com)
// and GMAIL_APP_PASSWORD (a 16-character Google "App Password" — NOT the
// normal account password; the account needs 2-Step Verification turned on
// to generate one). See README for setup steps.
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;
function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

export async function sendEmailMessage(to: string, subject: string, text: string): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;
  try {
    await t.sendMail({ from: process.env.GMAIL_USER, to, subject, text });
    return true;
  } catch (err) {
    console.error("sendEmailMessage failed:", err);
    return false;
  }
}

// ---------- SMS (configurable REST gateway) ----------
// Bangladesh has many SMS gateways (BulkSMSBD, Alpha SMS, etc.) and each has
// its own URL shape, so rather than hard-coding one, SMS_API_URL is a
// template with placeholders that get filled in and requested with GET:
//   {API_KEY}   -> SMS_API_KEY
//   {SENDER_ID} -> SMS_SENDER_ID (optional, omit the param if unused)
//   {NUMBER}    -> recipient's number (URL-encoded)
//   {MESSAGE}   -> the message text (URL-encoded)
// Example for BulkSMSBD (bulksmsbd.net):
//   SMS_API_URL="http://bulksmsbd.net/api/smsapi?api_key={API_KEY}&type=text&number={NUMBER}&senderid={SENDER_ID}&message={MESSAGE}"
export async function sendSmsMessage(to: string, message: string): Promise<boolean> {
  const urlTemplate = process.env.SMS_API_URL;
  const apiKey = process.env.SMS_API_KEY;
  if (!urlTemplate || !apiKey) return false;

  const url = urlTemplate
    .replace("{API_KEY}", encodeURIComponent(apiKey))
    .replace("{SENDER_ID}", encodeURIComponent(process.env.SMS_SENDER_ID || ""))
    .replace("{NUMBER}", encodeURIComponent(to))
    .replace("{MESSAGE}", encodeURIComponent(message));

  try {
    const res = await fetch(url);
    return res.ok;
  } catch (err) {
    console.error("sendSmsMessage failed:", err);
    return false;
  }
}

// A contact value from the students table is either a phone number or an
// email — admin-added students may have either in their "phone" field.
export function isEmailContact(value: string): boolean {
  return value.includes("@");
}

// Picks the best contact point for a student. Self-registered members log in
// with their email (stored as their "roll"), so prefer that when present;
// otherwise fall back to their "phone" field (used by admin-added students,
// and optionally by self-registered members who also gave a mobile number).
export function resolveContact(roll: string, phone?: string | null): string {
  const rollTrimmed = roll?.trim() || "";
  if (isEmailContact(rollTrimmed)) return rollTrimmed;
  return phone?.trim() || "";
}
