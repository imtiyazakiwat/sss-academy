import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

export function Section({
  id,
  className,
  children,
  tone = "light",
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  tone?: "light" | "muted" | "dark";
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-20 sm:py-28",
        tone === "muted" && "bg-ink-50",
        tone === "dark" && "bg-navy-950 text-white",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Eyebrow({
  children,
  tone = "light",
  className,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-eyebrow flex items-center gap-2.5 uppercase",
        tone === "dark" ? "text-violet-300" : "text-violet-600",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-px w-6",
          tone === "dark" ? "bg-violet-300/60" : "bg-violet-500/60",
        )}
      />
      {children}
    </p>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  tone = "light",
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: "light" | "dark";
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? <Eyebrow tone={tone}>{eyebrow}</Eyebrow> : null}
      <h2
        className={cn(
          "text-headline sm:text-display max-w-3xl",
          tone === "dark" ? "text-white" : "text-navy-950",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "max-w-2xl text-lg leading-relaxed",
            tone === "dark" ? "text-navy-200" : "text-ink-600",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
