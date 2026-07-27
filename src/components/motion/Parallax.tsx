"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Scroll-driven parallax on a single shared rAF loop.
 *
 * All instances register into one module-level ticker so N parallax layers
 * still cost one scroll listener and one frame callback. Only `transform` is
 * written, so the work stays on the compositor.
 */
type Layer = {
  el: HTMLElement;
  speed: number;
  axis: "y" | "x";
  rotate: number;
};

const layers = new Set<Layer>();
let frame = 0;
let listening = false;

function update() {
  frame = 0;
  const viewport = window.innerHeight;

  for (const layer of layers) {
    const rect = layer.el.getBoundingClientRect();
    if (rect.bottom < -200 || rect.top > viewport + 200) continue;

    // -1 .. 1 across the element's journey through the viewport
    const progress =
      (rect.top + rect.height / 2 - viewport / 2) / (viewport / 2 + rect.height / 2);
    const shift = progress * layer.speed * -100;
    const rotation = layer.rotate ? progress * layer.rotate : 0;

    layer.el.style.transform =
      layer.axis === "y"
        ? `translate3d(0, ${shift.toFixed(2)}px, 0) rotate(${rotation.toFixed(2)}deg)`
        : `translate3d(${shift.toFixed(2)}px, 0, 0) rotate(${rotation.toFixed(2)}deg)`;
  }
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(update);
}

function ensureListening() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
}

export function Parallax({
  children,
  speed = 0.15,
  axis = "y",
  rotate = 0,
  className,
}: {
  children: ReactNode;
  /** Fraction of viewport height to travel. Keep under ~0.3 to stay tasteful. */
  speed?: number;
  axis?: "y" | "x";
  /** Degrees of counter-rotation across the scroll range */
  rotate?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Parallax on small screens costs more than it adds.
    if (window.matchMedia("(max-width: 767px)").matches) return;

    const layer: Layer = { el, speed, axis, rotate };
    layers.add(layer);
    ensureListening();
    schedule();

    return () => {
      layers.delete(layer);
      el.style.transform = "";
    };
  }, [speed, axis, rotate]);

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}
