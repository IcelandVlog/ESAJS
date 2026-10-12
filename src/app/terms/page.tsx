import type { Metadata } from "next";
import LegalPage, { LEGAL_EMAIL } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Service | ESAJS" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service / ব্যবহারের শর্তাবলি">
      <p>By using this website you agree to the following terms.</p>
      <ul>
        <li>This site is for students, alumni and members of ESAJS. Provide accurate information when registering.</li>
        <li>Keep your password secret. You are responsible for activity on your account.</li>
        <li>Do not misuse the site, attempt unauthorised access, or upload unlawful or offensive content.</li>
        <li>Administrators may edit or remove content and suspend accounts that break these terms.</li>
        <li>The site is provided as-is, without warranty. Notices and results shown here are for convenience; the school&apos;s official records prevail.</li>
        <li>We may update these terms; continued use means you accept the changes.</li>
      </ul>
      <p>
        See also our <a href="/policy">Privacy Policy</a>. Questions: <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
