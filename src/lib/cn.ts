type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

/**
 * Minimal class combiner. Deliberately not `clsx` + `tailwind-merge` — the
 * component API here uses explicit variants, so conflict resolution isn't
 * needed and we save the dependency weight.
 */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  const walk = (value: ClassValue) => {
    if (!value) return;
    if (typeof value === "string" || typeof value === "number") {
      out.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    for (const [key, enabled] of Object.entries(value)) {
      if (enabled) out.push(key);
    }
  };

  inputs.forEach(walk);
  return out.join(" ");
}
