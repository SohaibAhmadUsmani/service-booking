import { Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

export function PrismAmbient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-1/4 top-0 h-[70vh] w-[70vh] rounded-full bg-violet-600/15 blur-[100px]" />
      <div className="absolute -right-1/4 top-1/3 h-[50vh] w-[50vh] rounded-full bg-cyan-500/10 blur-[90px]" />
      <div className="absolute bottom-0 left-1/3 h-[40vh] w-[40vh] rounded-full bg-fuchsia-600/10 blur-[80px]" />
    </div>
  );
}

export function BlurInWords({
  text,
  className,
  delayStep = 0.07,
}: {
  text: string;
  className?: string;
  delayStep?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="prism-blur-in inline-block opacity-0"
          style={{
            animationDelay: `${i * delayStep}s`,
            animationFillMode: "forwards",
          }}
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}

export function PrismSectionHeading({
  eyebrow,
  title,
  titleAccent,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  titleAccent?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={cn(centered && "text-center", className)}>
      {eyebrow && (
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "mt-3 text-balance text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-[2.75rem] md:leading-tight",
          centered && "mx-auto max-w-2xl"
        )}
      >
        {title}{" "}
        {titleAccent && (
          <span className={cn(instrumentSerif.className, "text-foreground/90")}>{titleAccent}</span>
        )}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base",
            centered && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export function GlassPanel({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "rounded-2xl border border-border bg-card shadow-md backdrop-blur-xl dark:bg-white/[0.04] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export { instrumentSerif };
