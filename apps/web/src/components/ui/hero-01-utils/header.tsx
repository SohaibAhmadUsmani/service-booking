"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowUpRight, Linkedin, Instagram, Twitter } from "lucide-react";
import { ServiceBookLogo } from "@/components/ui/service-book-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export type NavigationSection = {
  title: string;
  href: string;
  isActive?: boolean;
};

type HeaderProps = {
  navigationData: NavigationSection[];
  className?: string;
};

function BookNowButton({ className }: { className?: string }) {
  return (
    <Button
      className={cn(
        "group relative h-10 w-fit overflow-hidden rounded-full border-0 bg-foreground p-1 ps-4 pe-12 text-sm font-medium text-background transition-all duration-500 hover:opacity-90 hover:ps-12 hover:pe-4",
        className
      )}
      asChild
    >
      <Link href="/book" className="inline-flex items-center">
        <span className="relative z-10">Book a service</span>
        <span className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
          <ArrowUpRight size={16} />
        </span>
      </Link>
    </Button>
  );
}

export default function Header({ navigationData, className }: HeaderProps) {
  const [sticky, setSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50);
  }, []);

  const handleResize = useCallback(() => {
    if (window.innerWidth >= 768) setIsOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleScroll, handleResize]);

  return (
    <header
      className={cn(
        "sticky inset-x-0 top-0 z-50 flex h-20 items-center justify-center px-4",
        className
      )}
    >
      <div
        className={cn(
          "flex h-fit w-full max-w-6xl items-center justify-between gap-3.5 transition-all duration-500 lg:gap-6",
          sticky
            ? "rounded-full border border-border bg-background/70 p-2.5 shadow-2xl backdrop-blur-xl"
            : "border-transparent bg-transparent"
        )}
      >
        <ServiceBookLogo />

        <NavigationMenu className="max-lg:hidden rounded-full border border-border bg-muted/50 p-0.5">
          <NavigationMenuList className="flex gap-0">
            {navigationData.map((navItem) => (
              <NavigationMenuItem key={navItem.title}>
                <NavigationMenuLink
                  href={navItem.href}
                  className={cn(
                    "rounded-full px-2 py-2 text-sm font-medium tracking-normal text-muted-foreground transition hover:bg-background hover:text-foreground lg:px-4",
                    navItem.isActive && "bg-background text-foreground shadow-sm"
                  )}
                >
                  {navItem.title}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <BookNowButton className="group hidden lg:flex" />

          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="block rounded-full border border-border p-2 text-foreground"
                  aria-label="Open menu"
                >
                  <Menu width={20} height={20} />
                </button>
              </SheetTrigger>

              <SheetContent showCloseButton={false} side="right" className="w-full border-l border-border bg-background p-0 sm:w-96">
                <div className="flex items-center justify-between p-6">
                  <ServiceBookLogo />
                  <SheetClose asChild>
                    <button type="button" className="block rounded-full border border-border p-2.5 text-foreground" aria-label="Close menu">
                      <X width={16} height={16} />
                    </button>
                  </SheetClose>
                </div>

                <div className="flex flex-col gap-12 overflow-y-auto px-6 pb-6">
                  <div className="flex flex-col gap-8">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <NavigationMenu orientation="vertical" className="flex-none items-start">
                      <NavigationMenuList className="flex flex-col items-start gap-3">
                        {navigationData.map((item) => (
                          <NavigationMenuItem key={item.title}>
                            <NavigationMenuLink
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className={cn(
                                "group/nav flex items-center p-0 text-2xl font-semibold tracking-tight transition-all hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
                                item.isActive
                                  ? "text-foreground"
                                  : "text-muted-foreground hover:translate-x-2 hover:text-foreground"
                              )}
                            >
                              <div
                                className={cn(
                                  "mr-0 h-0.5 bg-primary transition-all duration-300",
                                  item.isActive
                                    ? "mr-2 w-4 opacity-100"
                                    : "w-0 opacity-0 group-hover/nav:mr-2 group-hover/nav:w-4 group-hover/nav:opacity-100"
                                )}
                              />
                              {item.title}
                            </NavigationMenuLink>
                          </NavigationMenuItem>
                        ))}
                      </NavigationMenuList>
                    </NavigationMenu>

                    <div className="flex flex-wrap items-center gap-3">
                      <ThemeToggle />
                      <BookNowButton className="group" />
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-4">
                    <div className="flex gap-3">
                      {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                        <a
                          key={i}
                          href="#"
                          className="flex items-center justify-center rounded-full border border-border p-3 text-muted-foreground transition hover:bg-muted"
                          aria-label="Social"
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} ServiceBook</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
