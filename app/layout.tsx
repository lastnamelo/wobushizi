import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "我不识字",
  description: "Cozy HSK character logger"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
