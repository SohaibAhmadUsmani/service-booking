"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Sparkles, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserRole } from "@service-booking/shared";

const navLinks = [
  { href: "#services", label: "Services" },
  { href: "#providers", label: "Providers" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const dashboardHref =
    user?.role === UserRole.Admin
      ? "/admin"
      : user?.role === UserRole.Provider
      ? "/provider"
      : "/profile";

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-brand-dark/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/landing" className="flex items-center gap-2 font-semibold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">ServiceBook</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-slate-300 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" className="text-slate-200 hover:bg-white/5 hover:text-white gap-2" asChild>
                <Link href={dashboardHref}>
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>{user?.firstName ? `Hi, ${user.firstName}` : "Dashboard"}</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 gap-1.5"
                onClick={() => logout()}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="text-slate-200 hover:bg-white/5 hover:text-white" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button className="bg-indigo-500 hover:bg-indigo-400" asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-300 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-white/5 bg-brand-dark/95 md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
            {isAuthenticated ? (
              <>
                <Button variant="outline" className="border-white/10 bg-transparent text-white" asChild>
                  <Link href={dashboardHref}>Go to Dashboard</Link>
                </Button>
                <Button
                  className="bg-rose-600 hover:bg-rose-500 text-white"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="border-white/10 bg-transparent text-white" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button className="bg-indigo-500 hover:bg-indigo-400" asChild>
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
