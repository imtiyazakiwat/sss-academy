"use client";

import { useEffect, useRef, useState } from "react";

import { ButtonLink } from "@/components/ui/Button";
import type { Banner } from "@/lib/cms/banners";
import { cn } from "@/lib/cn";

const DAY_FORMAT = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * The homepage announcement popup.
 *
 * Staff-authored only — same rule as `NoticeBar`. If no active banner exists
 * in Firestore, this renders nothing rather than manufacturing urgency. When
 * more than one banner is active, visitors can page through them with the
 * arrows or the dots. It shows on every load of the homepage — dismissing it
 * only closes the current view, it does not suppress future visits.
 */
export function AnnouncementPopup({ banners }: { banners: Banner[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (banners.length === 0) return;
    setOpen(true);
  }, [banners.length]);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (banners.length === 0 || !open) return null;

  function dismiss() {
    setOpen(false);
  }

  const banner = banners[index];
  const hasMultiple = banners.length > 1;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-navy-950/70 px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-popup-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgb(15_48_40/0.5)]"
      >
        {/* Header bar with the terracotta corner flourish from the brand */}
        <div className="relative flex items-center justify-between gap-3 bg-navy-900 px-5 py-4">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 right-0 w-10 [clip-path:polygon(100%_0,100%_100%,0_0)] bg-ember-600"
          />
          <p className="relative text-sm font-semibold tracking-[0.08em] text-white uppercase">
            Important Announcement
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={dismiss}
            aria-label="Close announcement"
            className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="relative flex flex-col items-center gap-4 px-6 pt-7 pb-6 text-center sm:px-8">
          {hasMultiple ? (
            <NavArrow
              direction="prev"
              onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
              className="left-1"
            />
          ) : null}
          {hasMultiple ? (
            <NavArrow
              direction="next"
              onClick={() => setIndex((i) => (i + 1) % banners.length)}
              className="right-1"
            />
          ) : null}

          <span className="flex size-12 items-center justify-center rounded-full bg-navy-50 text-navy-700">
            <CapIcon />
          </span>

          <h2
            id="announcement-popup-title"
            className="text-title text-navy-950"
          >
            {banner.title}
          </h2>

          <p className="text-sm leading-6 text-ink-600">{banner.description}</p>

          {hasMultiple ? (
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Announcements">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show announcement ${i + 1} of ${banners.length}`}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "size-1.5 rounded-full transition-colors",
                    i === index ? "bg-ember-600" : "bg-ink-200 hover:bg-ink-300",
                  )}
                />
              ))}
            </div>
          ) : null}

          <div className="mt-1 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
            <ButtonLink href={banner.primaryHref} onClick={dismiss} className="sm:flex-1">
              {banner.primaryLabel}
            </ButtonLink>
            {banner.secondaryHref && banner.secondaryLabel ? (
              <ButtonLink
                href={banner.secondaryHref}
                variant="ghost"
                onClick={dismiss}
                className="sm:flex-1"
              >
                {banner.secondaryLabel}
              </ButtonLink>
            ) : null}
          </div>
        </div>

        {banner.deadlineAtMs ? (
          <div className="flex items-center gap-2 border-t border-ink-100 bg-ink-50 px-6 py-3 text-xs text-ink-600 sm:px-8">
            <AlertIcon />
            <span>
              {banner.deadlineLabel ?? "Last date to apply"}:{" "}
              <span className="font-semibold text-navy-900">
                {DAY_FORMAT.format(new Date(banner.deadlineAtMs))}
              </span>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NavArrow({
  direction,
  onClick,
  className,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous announcement" : "Next announcement"}
      className={cn(
        "absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 shadow-subtle transition-colors hover:border-navy-300 hover:text-navy-900",
        className,
      )}
    >
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-3.5">
        <path
          d={direction === "prev" ? "M10 3.5 5.5 8 10 12.5" : "M6 3.5 10.5 8 6 12.5"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4">
      <path
        d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-6">
      <path
        d="M12 3 2 8l10 5 8-4v6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10.5V15c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="size-4 shrink-0 text-ember-600"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 5v3.5M8 11h.01"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
