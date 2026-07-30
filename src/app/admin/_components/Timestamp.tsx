/**
 * Timestamps in the dashboard.
 *
 * Rendered on the server, which is fine because every admin route is
 * `force-dynamic` — the relative label is computed per request, never cached.
 * Absolute times are pinned to IST rather than the server's zone, since the
 * people reading this are in Chikkodi and Vercel runs in UTC.
 */
const TZ = "Asia/Kolkata";

const absolute = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dayOnly = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatAbsolute(ms: number): string {
  return absolute.format(new Date(ms));
}

export function formatDay(ms: number): string {
  return dayOnly.format(new Date(ms));
}

export function formatRelative(ms: number, now = Date.now()): string {
  const diff = now - ms;
  if (diff < 0) return formatAbsolute(ms);

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 35) return `${Math.floor(days / 7)}w ago`;

  return dayOnly.format(new Date(ms));
}

export function Timestamp({
  ms,
  relative = true,
  className,
}: {
  ms: number | null;
  relative?: boolean;
  className?: string;
}) {
  if (ms === null) {
    return (
      <span className={className} title="No timestamp recorded">
        —
      </span>
    );
  }

  return (
    <time
      dateTime={new Date(ms).toISOString()}
      title={formatAbsolute(ms)}
      className={className}
    >
      {relative ? formatRelative(ms) : formatAbsolute(ms)}
    </time>
  );
}
