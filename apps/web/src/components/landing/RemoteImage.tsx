"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function RemoteImage({
  src,
  alt,
  className,
  fill,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const isLocal = src.startsWith("/");

  if (failed) {
    return (
      <div
        className={cn("bg-muted", fill && "absolute inset-0", className)}
        role="img"
        aria-label={alt}
      />
    );
  }

  if (isLocal) {
    return (
      <Image
        src={`${src}?v=2`}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        unoptimized
        className={cn(fill && "object-cover", className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
      onError={() => setFailed(true)}
    />
  );
}
