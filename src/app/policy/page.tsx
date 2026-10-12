import type { Metadata } from "next";
import LegalPage, { LEGAL_EMAIL } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy | ESAJS" };

export default function PolicyPage() {
  return (
    <LegalPage title="Privacy Policy / গোপনীয়তা নীতি">
      <p>
        This website is run by the Ex-Students Association of Jalalpur Secondary School (ESAJS) for its
        students, alumni and members. This policy explains what information we collect and how we use it.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>Account details you give us when you register: name, roll, class, batch, phone number, address, date of birth, blood group, parents&apos; names and a profile photo.</li>
        <li>If you choose &quot;Continue with Google&quot; or &quot;Continue with Facebook&quot;: your name, email address and profile picture from that account. We never receive your Facebook or Google password and we do not post on your behalf.</li>
        <li>School records managed by administrators, such as exam results, attendance and reunion registrations.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To create and secure your account and let you log in.</li>
        <li>To show notices, results, member information and birthday wishes inside the website.</li>
        <li>To organise alumni events such as reunions.</li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We do not sell your information. Member details are visible only to logged-in members and
        administrators of the association. We may share data only when required by law.
      </p>

      <h2>Storage and security</h2>
      <p>
        Data is stored in our database. Passwords are stored in hashed form. We keep your data for as long
        as your account exists.
      </p>

      <h2>Your choices and deletion</h2>
      <p>
        You can update your details from your profile page. You can ask us to delete your account and data
        at any time — see our <a href="/data-deletion">Data Deletion Instructions</a>.
      </p>

      <h2>বাংলায় সারসংক্ষেপ</h2>
      <p>
        রেজিস্ট্রেশনের সময় দেওয়া তথ্য এবং Google/Facebook দিয়ে লগইন করলে আপনার নাম, ইমেইল ও প্রোফাইল ছবি
        আমরা সংরক্ষণ করি। এই তথ্য শুধু অ্যাকাউন্ট তৈরি, লগইন, নোটিশ/রেজাল্ট দেখানো এবং অ্যালামনাই
        ইভেন্ট আয়োজনের কাজে ব্যবহার হয়। আমরা কারো তথ্য বিক্রি করি না। তথ্য মুছে ফেলতে চাইলে
        <a href="/data-deletion"> Data Deletion</a> পেজ দেখুন।
      </p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
