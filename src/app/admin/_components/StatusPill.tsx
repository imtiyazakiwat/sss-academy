import type { ReactNode } from "react";

import { STATUS_LABELS, type EnquiryStatus } from "@/lib/cms/enquiry-schema";
import { cn } from "@/lib/cn";

export { STATUS_LABELS };

/**
 * Status is the only piece of workflow state in the inbox, so it gets colour.
 * `new` uses terracotta because it is the one status that needs action.
 */
const styles: Record<EnquiryStatus, string> = {
  new: "border-ember-200 bg-ember-50 text-ember-800",
  open: "border-navy-200 bg-navy-50 text-navy-800",
  replied: "border-mint-100 bg-mint-50 text-mint-700",
  closed: "border-ink-200 bg-ink-50 text-ink-600",
};

export function StatusPill({ status }: { status: EnquiryStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-semibold tracking-wide uppercase",
        styles[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "good" | "warn" | "bad";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-semibold tracking-wide uppercase",
        tone === "neutral" && "border-ink-200 bg-ink-50 text-ink-600",
        tone === "good" && "border-mint-100 bg-mint-50 text-mint-700",
        tone === "warn" && "border-ember-200 bg-ember-50 text-ember-800",
        tone === "bad" && "border-ember-300 bg-ember-100 text-ember-900",
      )}
    >
      {children}
    </span>
  );
}
