import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import LanguageGate from "@/components/LanguageGate";

export const metadata: Metadata = {
  title: "Ex-Students Association of Jalalpur Secondary School (ESAJS)",
  description: "ESAJS-এর অফিসিয়াল ওয়েবসাইট — নোটিশ, রেজাল্ট ও সদস্য তথ্য",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink font-body">
        <LanguageProvider>
          <LanguageGate />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
