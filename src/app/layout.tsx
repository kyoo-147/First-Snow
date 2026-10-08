import type { Metadata } from "next";
import "./globals.css";

// Wave 1 localization: Vietnamese-first. lang="vi" sets the BCP-47 document
// language for screen readers, SEO, and Intl.* APIs. Later lanes that add
// locale-prefixed routes will override this per-layout via generateStaticParams.
export const metadata: Metadata = {
  title: "AgentKid – Trợ lý học tập thông minh",
  description:
    "Nền tảng học tập cá nhân hoá cho trẻ em, được hướng dẫn bởi phụ huynh và hỗ trợ bởi AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
