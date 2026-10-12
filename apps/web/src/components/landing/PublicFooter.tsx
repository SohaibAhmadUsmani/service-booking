import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { ServiceBookLogo } from "@/components/ui/service-book-logo";

const footerLinks = {
  Product: [
    { label: "Search services", href: "/search" },
    { label: "Categories", href: "/categories" },
    { label: "Providers", href: "/providers" },
  ],
  Company: [
    { label: "Become a provider", href: "/register" },
    { label: "How it works", href: "/landing#how-it-works" },
    { label: "FAQ", href: "/landing#faq" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Contact", href: "#" },
  ],
};

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-background pt-16 text-muted-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <ServiceBookLogo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Discover trusted local professionals. Book services with transparent pricing and
            verified providers.
          </p>
          <div className="mt-6 flex gap-3">
            {[Twitter, Instagram, Linkedin, Facebook].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
                aria-label="Social link"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-foreground">{title}</p>
            <ul className="mt-4 space-y-2">
              {links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm transition hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ServiceBook. All rights reserved.
      </div>
    </footer>
  );
}
