import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SnapExpense — Smart Receipt Scanner & Expense Tracker",
  description:
    "Scan receipts, track expenses, and manage your budget with AI-powered OCR. SnapExpense makes expense tracking effortless.",
  keywords: ["expense tracker", "receipt scanner", "OCR", "budget", "INR"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7C3AED",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
