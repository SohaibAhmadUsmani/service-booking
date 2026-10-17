"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, Sparkles, User, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";

const LINKS = [
  { href: "/search", label: "Services" },
  { href: "/providers", label: "Providers" },
  { href: "/bookings", label: "My bookings" },
  { href: "/notifications", label: "Notifications" },
  { href: "/payments", label: "Payments" },
  { href: "/complaints", label: "Disputes" },
];

/** Shared top bar for the customer pages. Uses the site theme tokens. */
export default function CustomerHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const linkClass = (href: string) =>
    cn(
      "text-sm transition-colors hover:text-gray-900",
      pathname === href || pathname.startsWith(`${href}/`) ? "font-semibold text-gray-900" : "text-gray-500"
    );

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/landing" className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-400/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">ServiceBook</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/book" className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400">Book a service</Link>
          
          {isAuthenticated ? (
            <>
              <Link href="/profile" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
                <User className="h-4 w-4 text-indigo-400" />
                {user?.firstName ? `Hi, ${user.firstName}` : "Profile"}
              </Link>
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">
                Log in
              </Link>
              <Link href="/register" className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-gray-500 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div className={cn("border-t border-gray-200 bg-white md:hidden", open ? "block" : "hidden")}>
        <div className="flex flex-col gap-1 px-4 py-3">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={cn("rounded-lg px-3 py-2", linkClass(l.href))}>
              {l.label}
            </Link>
          ))}
          <Link href="/book" onClick={() => setOpen(false)} className="mt-1 rounded-lg bg-indigo-500 px-3 py-2 text-center text-sm font-semibold text-white">Book a service</Link>
          <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-3">
            
            {isAuthenticated ? (
              <button
                onClick={() => {
                  void logout();
                  setOpen(false);
                }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500"
              >
                Sign out
              </button>
            ) : (
              <Link href="/login" className="text-sm text-gray-500" onClick={() => setOpen(false)}>
                Log in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}