import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumina · Quản lý trung tâm dạy học",
  description: "Kết nối học viên, đào tạo, học phí và chăm sóc học viên trong một hệ thống.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
