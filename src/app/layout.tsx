import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "উদয়ন উচ্চ বিদ্যালয় | Udayan High School",
  description: "স্কুলের অফিসিয়াল ওয়েবসাইট — নোটিশ, রেজাল্ট ও শিক্ষার্থী তথ্য",
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
      <body className="min-h-full flex flex-col bg-paper text-ink font-body">{children}</body>
    </html>
  );
}
