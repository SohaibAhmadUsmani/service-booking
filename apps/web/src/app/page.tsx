import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarCheck,
  CreditCard,
  LayoutGrid,
  LogIn,
  Search,
  ShieldCheck,
  Store,
  UserPlus,
} from "lucide-react";
import { InteractiveGridPattern } from "../components/ui/InteractiveGridPattern";
import { ParticlesBg } from "../components/ui/ParticlesBg";

export const metadata: Metadata = {
  title: "Service Booking Platform",
  description:
    "Discover verified service providers, compare prices, and manage your bookings, payments and updates in one place.",
};

const browseLinks = [
  {
    href: "/search",
    title: "Search services",
    description:
      "Explore services by name, category, location, price, rating, type and date.",
    Icon: Search,
  },
  {
    href: "/providers",
    title: "Verified providers",
    description:
      "Browse provider profiles with services, prices, working hours and reviews.",
    Icon: BadgeCheck,
  },
  {
    href: "/categories",
    title: "Categories",
    description:
      "Jump straight to the kind of work you need, from repairs to home care.",
    Icon: LayoutGrid,
  },
];

const accountLinks = [
  {
    href: "/notifications",
    title: "Notifications",
    description:
      "Booking, payment and review updates collected in a single feed.",
    Icon: Bell,
  },
  {
    href: "/payments",
    title: "Payments",
    description:
      "Review checkout status for your bookings and manage refunds.",
    Icon: CreditCard,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-dark">
        <InteractiveGridPattern
          className="opacity-40"
          squaresClassName="hover:fill-indigo-500/30"
        />
        <ParticlesBg />
        <div className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-600/25 via-purple-600/15 to-transparent blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-8">
          {/* Top navigation */}
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
              </span>
              <span className="text-xl font-bold tracking-tight text-white">
                Service<span className="text-indigo-400">Booking</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
              <Link
                href="/search"
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                Search
              </Link>
              <Link
                href="/providers"
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                Providers
              </Link>
              <Link
                href="/categories"
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                Categories
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Get started
              </Link>
            </div>
          </header>

          {/* Hero copy */}
          <div className="mx-auto mt-20 max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-200">
              <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Book trusted services in minutes
            </span>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              Find and book trusted
              <span className="block bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                services near you
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Discover verified providers, compare prices, and manage every
              booking, payment and update from one secure place.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-colors hover:bg-indigo-700 sm:w-auto"
              >
                Create free account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/providers"
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Browse providers
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-indigo-300 underline-offset-4 hover:text-white hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Browse the marketplace */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Browse the marketplace
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Start by exploring what providers offer, then book a time that works
            for you.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {browseLinks.map(({ href, title, description, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-500">{description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                Open
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Your account */}
      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Everything in one account
            </h2>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Once you sign in, keep track of your activity without chasing
              separate inboxes or receipts.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {accountLinks.map(({ href, title, description, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="flex items-center gap-2">
                    <span className="text-base font-semibold text-slate-900">
                      {title}
                    </span>
                    <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      Sign in required
                    </span>
                  </span>
                  <span className="mt-1.5 block text-sm text-slate-500">
                    {description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* For providers */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-brand-dark p-8 sm:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-tr from-indigo-600/30 to-purple-600/10 blur-3xl" />
          <div className="relative z-10 flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                <Store className="h-4 w-4" aria-hidden="true" />
                For providers
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Grow your service business
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                Publish your services, manage availability, and keep on top of
                bookings and earnings from a dedicated provider workspace.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register?role=provider"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-colors hover:bg-indigo-700"
              >
                Become a provider
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/provider"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/20 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Provider dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <ShieldCheck className="h-4 w-4 text-white" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-slate-900">
              Service Booking Platform
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Footer">
            <Link href="/search" className="text-sm text-slate-500 hover:text-indigo-600">
              Search
            </Link>
            <Link href="/providers" className="text-sm text-slate-500 hover:text-indigo-600">
              Providers
            </Link>
            <Link href="/categories" className="text-sm text-slate-500 hover:text-indigo-600">
              Categories
            </Link>
            <Link href="/login" className="text-sm text-slate-500 hover:text-indigo-600">
              Sign in
            </Link>
            <Link href="/register" className="text-sm text-slate-500 hover:text-indigo-600">
              Register
            </Link>
          </nav>

          <p className="text-xs text-slate-400">
            © 2026 Service Booking Platform
          </p>
        </div>
      </footer>
    </main>
  );
}
