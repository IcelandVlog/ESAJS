import type { Metadata } from "next";
import LegalPage, { LEGAL_EMAIL } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Data Deletion Instructions | ESAJS" };

export default function DataDeletionPage() {
  return (
    <LegalPage title="Data Deletion Instructions / তথ্য মুছে ফেলার নিয়ম">
      <p>
        You can ask ESAJS to delete your account and all personal data we hold about you, including data
        received through Facebook or Google login.
      </p>

      <h2>How to request deletion</h2>
      <ul>
        <li>
          Send an email to <a href={`mailto:${LEGAL_EMAIL}?subject=Data%20deletion%20request`}>{LEGAL_EMAIL}</a> with
          the subject &quot;Data deletion request&quot;.
        </li>
        <li>Include your full name, roll/batch and the email address used to log in, so we can find your account.</li>
        <li>We will delete your account and data within 30 days and confirm by email.</li>
      </ul>

      <h2>Remove the Facebook connection</h2>
      <p>
        You can also open Facebook → Settings → Apps and Websites, find &quot;ESAJS&quot; and remove it. This
        stops ESAJS from receiving any further information from your Facebook account.
      </p>

      <h2>বাংলায়</h2>
      <p>
        আপনার অ্যাকাউন্ট ও তথ্য মুছতে চাইলে {LEGAL_EMAIL} ঠিকানায় নাম, রোল/ব্যাচ ও লগইন ইমেইল সহ
        &quot;Data deletion request&quot; সাবজেক্টে ইমেইল করুন। ৩০ দিনের মধ্যে আমরা মুছে ফেলব।
      </p>
    </LegalPage>
  );
}
