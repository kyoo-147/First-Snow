import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentKid | Mia, người bạn AI cho bé",
  description:
    "AgentKid là web app AI companion tiếng Việt giúp phụ huynh đồng hành cùng trẻ ASD và chậm ngôn ngữ tại nhà."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
