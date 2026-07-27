import { initials, type Placement } from "@/content/placements";
import { cn } from "@/lib/cn";

const tints = [
  "bg-navy-900 text-white",
  "bg-ember-600 text-white",
  "bg-navy-100 text-navy-800",
  "bg-navy-600 text-white",
  "bg-ember-100 text-ember-700",
];

function tintFor(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) | 0;
  }
  return tints[Math.abs(hash) % tints.length];
}

function packageLabel(value: number) {
  return `₹${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)} LPA`;
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
        "group flex h-full flex-col rounded-[1.75rem] border border-white/90 bg-[#fffdf8]/90 p-5 shadow-[0_1px_2px_rgb(23_63_53/0.05),0_14px_36px_-22px_rgb(23_63_53/0.28)] ring-1 ring-navy-900/[0.06] backdrop-blur-xl transition-[box-shadow,transform] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgb(23_63_53/0.06),0_20px_44px_-22px_rgb(23_63_53/0.36)] sm:p-6",
        className,
      )}
    >
      <figcaption className="flex items-center gap-3.5">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-[0.9rem] text-sm font-semibold tracking-tight shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]",
            tintFor(placement.name),
          )}
        >
          {initials(placement.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[0.9375rem] font-semibold tracking-[-0.01em] text-navy-950">
            {placement.name}
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-ink-500">
            {placement.role}
          </p>
        </div>
      </figcaption>

      <blockquote
        className={cn(
          "relative mt-5 flex-1 border-t border-ink-200/80 pt-5 text-sm leading-7 text-ink-600",
          compact && "line-clamp-4",
        )}
      >
        <span
          aria-hidden="true"
          className="mr-1 font-serif text-2xl leading-none text-navy-300"
        >
          “
        </span>
        {placement.quote}
      </blockquote>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink-200/80 pt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1.5 text-xs text-navy-800 ring-1 ring-navy-900/8">
          <span className="text-ink-500">Package</span>
          <strong className="font-semibold">{packageLabel(placement.packageLpa)}</strong>
        </span>
        {placement.location ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1.5 text-xs text-ink-600 ring-1 ring-ink-900/6">
            <LocationIcon />
            {placement.location}
          </span>
        ) : null}
      </div>
    </figure>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden="true">
      <path
        d="M8 14s4-3.6 4-7a4 4 0 1 0-8 0c0 3.4 4 7 4 7Zm0-5.5A1.5 1.5 0 1 0 8 5a1.5 1.5 0 0 0 0 3.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
