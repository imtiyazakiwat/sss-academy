import { initials, type Placement } from "@/content/placements";
import { cn } from "@/lib/cn";

/** Stable avatar tint from the name, so each card is distinct but on-palette. */
const tints = [
  "bg-navy-900 text-white",
  "bg-ember-500 text-white",
  "bg-navy-100 text-navy-800",
  "bg-navy-600 text-white",
  "bg-ember-100 text-ember-700",
];

function tintFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return tints[Math.abs(hash) % tints.length];
}

export function PlacementCard({
  placement,
  className,
  compact = false,
}: {
  placement: Placement;
  className?: string;
  compact?: boolean;
}) {
  return (
    <figure
      className={cn(
        "flex h-full flex-col rounded-2xl border border-ink-200 bg-white p-6 shadow-subtle transition-[transform,box-shadow] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-card",
        className,
      )}
    >
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold tracking-tight",
            tintFor(placement.name),
          )}
        >
          {initials(placement.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[0.9375rem] font-semibold text-navy-950">
            {placement.name}
          </p>
          <p className="truncate text-xs text-ink-500">{placement.role}</p>
        </div>
        <span className="ml-auto shrink-0 rounded-full bg-navy-950 px-2.5 py-1 font-mono text-xs font-medium text-white">
          {placement.packageLpa.toFixed(2)} LPA
        </span>
      </div>

      <blockquote
        className={cn(
          "mt-5 text-sm leading-relaxed text-ink-600",
          compact && "line-clamp-4",
        )}
      >
        {placement.quote}
      </blockquote>

      <figcaption className="mt-auto flex items-center gap-2 pt-5 text-xs text-ink-400">
        <svg viewBox="0 0 14 14" className="size-3.5 shrink-0" aria-hidden="true">
          <path
            d="M2.5 12V3.2c0-.4.3-.7.7-.7h4.1c.4 0 .7.3.7.7V12M8 6h2.8c.4 0 .7.3.7.7V12M1.2 12h11.6M4.6 5h1.4M4.6 7.5h1.4M4.6 10h1.4"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        Placed at {placement.company}
        {placement.location ? ` · ${placement.location}` : ""}
      </figcaption>
    </figure>
  );
}
