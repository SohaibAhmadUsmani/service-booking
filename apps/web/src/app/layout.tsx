import type { Metadata } from "next";
import "./globals.css";
import { SmoothScrollProvider } from "../components/providers/SmoothScrollProvider";
import { ThemeProvider } from "../components/providers/ThemeProvider";
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-indigo-500 selection:text-white">
        <ThemeProvider>
          <SmoothScrollProvider>
            <AuthProvider>{children}</AuthProvider>
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
