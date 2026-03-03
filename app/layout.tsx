import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "gdurls-clone",
  description: "Shortlinks + click tracking for Google Drive URLs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}