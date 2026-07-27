"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

type Direction = "up" | "down" | "left" | "right" | "none";

const offsets: Record<Direction, string> = {
  up: "translate3d(0, 24px, 0)",
  down: "translate3d(0, -24px, 0)",
  left: "translate3d(28px, 0, 0)",
  right: "translate3d(-28px, 0, 0)",
  none: "translate3d(0, 0, 0)",
};

const SHOWN = "translate3d(0, 0, 0) scale(1)";

/**
 * Scroll-triggered reveal built on IntersectionObserver plus a CSS transition.
 *
 * Deliberately not a motion library, and deliberately not React state: the
 * reveal is a one-shot style write, so the effect drives the DOM node directly.
 * That avoids a re-render per element on scroll and keeps the work on the
 * compositor. The observer disconnects as soon as it fires.
 *
 * The hidden state is the server-rendered default, so markup is identical on
 * both sides of hydration.
 */
export function Reveal({
  children,
  as: Tag = "div",
  direction = "up",
  delay = 0,
  duration = 700,
  scale,
  threshold = 0.15,
  className,
  style,
}: {
  children: ReactNode;
  as?: ElementType;
  direction?: Direction;
  /** ms */
  delay?: number;
  /** ms */
  duration?: number;
  /** Starting scale, e.g. 0.98 for a subtle push-in */
  scale?: number;
  threshold?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const show = () => {
      node.style.opacity = "1";
      node.style.transform = SHOWN;
    };

    // Users who asked for less motion get the final state with no transition.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.style.transition = "none";
      show();
      return;
    }

    // Already in view on mount (above the fold) — reveal without an observer.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          show();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  const hidden = scale
    ? `${offsets[direction]} scale(${scale})`
    : offsets[direction];

  return (
    <Tag
      ref={ref}
      data-reveal=""
      className={cn("will-change-[opacity,transform]", className)}
      style={{
        opacity: 0,
        transform: hidden,
        transition: `opacity ${duration}ms var(--ease-out-expo) ${delay}ms, transform ${duration}ms var(--ease-out-expo) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
