import type { Metadata } from "next";
import "./globals.css";
import { SmoothScrollProvider } from "../components/providers/SmoothScrollProvider";
import { AuthProvider } from "../lib/auth/AuthContext";

export const metadata: Metadata = {
  title: "Service Booking Platform — Secure Identity & Access",
  description: "Enterprise-grade identity management and service booking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
        <SmoothScrollProvider>
          <AuthProvider>{children}</AuthProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
