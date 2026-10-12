import Link from "next/link";
import { cn } from "@/lib/utils";

export function ServiceBookLogo({ className }: { className?: string }) {
  return (
    <Link href="/landing" className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
        S
      </span>
      <span className="text-base font-semibold tracking-tight text-foreground">ServiceBook</span>
    </Link>
  );
}
