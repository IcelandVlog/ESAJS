import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import LanguageGate from "@/components/LanguageGate";
import BirthdayPopup from "@/components/BirthdayPopup";

export const metadata: Metadata = {
  title: "Ex-Students Association of Jalalpur Secondary School (ESAJS)",
  description: "ESAJS-এর অফিসিয়াল ওয়েবসাইট — নোটিশ, রেজাল্ট ও সদস্য তথ্য",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // suppressHydrationWarning: the inline script in <head> adds the "dark" class
  // to <html> before React hydrates, so its className legitimately differs from
  // the server-rendered markup.
  return (
    <html lang="bn" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Applied before hydration so there's no light->dark flash on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              var t = localStorage.getItem("esajs_theme");
              if (!t) t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
              if (t === "dark") document.documentElement.classList.add("dark");
            } catch (e) {}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink font-body">
        <ThemeProvider>
          <LanguageProvider>
            <LanguageGate />
            <BirthdayPopup />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
