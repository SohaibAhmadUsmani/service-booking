import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Service Booking",
  description: "Book and manage services online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
