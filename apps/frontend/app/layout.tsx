import type { Metadata } from "next";
import "./globals.css";
import { FinAppProvider } from "@/lib/finance/auth-context";

export const metadata: Metadata = {
  title: "汤圆财税",
  description: "让每个决策都有数据支撑",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased"><FinAppProvider>{children}</FinAppProvider></body>
    </html>
  );
}
