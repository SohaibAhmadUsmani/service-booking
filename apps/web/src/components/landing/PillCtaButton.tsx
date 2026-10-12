"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PillCtaButtonProps = {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  className?: string;
};

export function PillCtaButton({
  href,
  onClick,
  children,
  variant = "primary",
  className,
}: PillCtaButtonProps) {
  const isPrimary = variant === "primary";
  const classes = cn(
    "group relative inline-flex h-12 items-center overflow-hidden rounded-full p-1 text-sm font-medium transition-all duration-500",
    isPrimary
      ? "bg-foreground ps-6 pe-14 text-background hover:ps-14 hover:pe-6"
      : "border border-border bg-transparent ps-6 pe-14 text-foreground hover:bg-accent hover:ps-14 hover:pe-6",
    className
  );

  const inner = (
    <>
      <span className="relative z-10">{children}</span>
      <span
        className={cn(
          "absolute right-1 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45",
          isPrimary ? "bg-background text-foreground" : "bg-foreground text-background"
        )}
      >
        <ArrowUpRight size={16} />
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {inner}
    </button>
  );
}
