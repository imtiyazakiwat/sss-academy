"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * True once the window has scrolled past `threshold` pixels.
 *
 * Checked on mount as well as on scroll so a restored scroll position (back
 * navigation, or a reload partway down the page) reports the correct state on
 * the first paint instead of flashing the unscrolled style.
 */
export function useScroll(threshold: number): boolean {
  const [scrolled, setScrolled] = useState(false);

  const onScroll = useCallback(() => {
    setScrolled(window.scrollY > threshold);
  }, [threshold]);

  useEffect(() => {
    // Passive: this only reads scrollY, so it must never block the scroll.
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  useEffect(() => {
    onScroll();
  }, [onScroll]);

  return scrolled;
}
