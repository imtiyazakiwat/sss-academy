import Link from "next/link";

import { ArrowIcon } from "@/components/ui/Button";
import { getActiveNotices } from "@/lib/cms/notices";

/**
 * Renders genuine, staff-authored urgency only. If no active notice exists in
 * Firestore, nothing renders — we don't manufacture a countdown.
 */
export async function NoticeBar() {
  const notices = await getActiveNotices();
  if (notices.length === 0) return null;

  const notice = notices[0];
  const body = (
    <>
      <span className="relative flex size-1.5 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-ember-300 opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-ember-200" />
      </span>
      <span className="truncate">{notice.message}</span>
      {notice.href ? (
        <span className="hidden shrink-0 items-center gap-1 font-semibold text-ember-200 sm:inline-flex">
          {notice.cta ?? "Learn more"}
          <ArrowIcon className="size-3.5" />
        </span>
      ) : null}
    </>
  );

  const classes =
    "group flex items-center justify-center gap-2.5 bg-navy-900 px-5 py-2.5 text-center text-[0.8125rem] font-medium text-navy-100";

  return (
    <div data-notice-bar="" className="relative z-40">
      {notice.href ? (
        <Link href={notice.href} className={classes}>
          {body}
        </Link>
      ) : (
        <p className={classes}>{body}</p>
      )}
    </div>
  );
}
