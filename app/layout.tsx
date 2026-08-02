import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Signal Desk — 人工智能情报简报",
  description:
    "聚合 Google News、Reddit、Hacker News 与 arXiv 的 AI 情报，并生成中文洞察。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
