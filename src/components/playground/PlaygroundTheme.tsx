"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type PgTheme = "dark" | "light";

const STORAGE_KEY = "sss-pg-theme";
const ATTRIBUTE = "data-pg-theme";

/**
 * Applied to <html> before first paint, so the playground never flashes the
 * wrong surface. Inline rather than a module because it has to run during HTML
 * parsing, ahead of any hydration.
 *
 * Client-side navigation into the playground does not execute this — React does
 * not run scripts it inserts — so the provider below re-asserts the attribute on
 * mount. Each covers the case the other cannot.
 */
export function PlaygroundThemeScript() {
  const script = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
    STORAGE_KEY,
  )});var t=s==="light"||s==="dark"?s:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.setAttribute(${JSON.stringify(
    ATTRIBUTE,
  )},t);}catch(e){document.documentElement.setAttribute(${JSON.stringify(
    ATTRIBUTE,
  )},"dark");}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function readStored(): PgTheme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function preferred(): PgTheme {
  return (
    readStored() ??
    (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
  );
}

function apply(theme: PgTheme): void {
  document.documentElement.setAttribute(ATTRIBUTE, theme);
}

/**
 * The theme is read from the DOM attribute rather than mirrored into React
 * state.
 *
 * The attribute is the single source of truth — an inline script sets it before
 * React exists, and CSS reads it directly — so treating it as an external store
 * keeps one copy of the value instead of two that can disagree. A
 * MutationObserver is the subscription.
 */
function subscribeToTheme(listener: () => void): () => void {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [ATTRIBUTE],
  });

  // Follow the OS, but only while the learner has not chosen for themselves.
  const media = window.matchMedia("(prefers-color-scheme: light)");
  const onMedia = (event: MediaQueryListEvent) => {
    if (readStored()) return;
    apply(event.matches ? "light" : "dark");
  };
  media.addEventListener("change", onMedia);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", onMedia);
  };
}

function themeSnapshot(): PgTheme {
  return document.documentElement.getAttribute(ATTRIBUTE) === "light"
    ? "light"
    : "dark";
}

export function usePgTheme(): {
  theme: PgTheme;
  setTheme: (theme: PgTheme) => void;
  toggle: () => void;
} {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    themeSnapshot,
    () => "dark" as PgTheme,
  );

  const setTheme = useCallback((next: PgTheme) => {
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing. The attribute is applied; only persistence is lost.
    }
  }, []);

  const toggle = useCallback(
    () => setTheme(themeSnapshot() === "light" ? "dark" : "light"),
    [setTheme],
  );

  return { theme, setTheme, toggle };
}

/**
 * On the server there is no layout phase, and calling useLayoutEffect there logs
 * a warning for every render of this client component. The behaviour we want
 * only exists in the browser, so pick the hook per environment — the standard
 * isomorphic-layout-effect idiom.
 */
const useApplyTheme = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Re-asserts the stored preference on mount. Writing to the DOM is the whole job
 * here — there is no state to set.
 *
 * It runs before paint because the inline script only executes on a full
 * document load: arrive at the playground by client-side navigation from, say,
 * the courses page and the attribute is not set yet, so a `light` reader would
 * otherwise catch a frame of the dark fallback.
 */
export function PlaygroundThemeProvider({ children }: { children: ReactNode }) {
  useApplyTheme(() => {
    apply(preferred());
  }, []);

  return <>{children}</>;
}

/** Sun/moon switch for the workspace status bar. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = usePgTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      title={`Switch to ${next} theme`}
      aria-label={`Switch to ${next} theme`}
      className={className}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
          <circle cx="8" cy="8" r="3.1" fill="currentColor" />
          <path
            d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3.1 3.1l1.1 1.1M11.8 11.8l1.1 1.1M12.9 3.1l-1.1 1.1M4.2 11.8l-1.1 1.1"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
          <path
            d="M13.2 10.3A5.6 5.6 0 0 1 6 3.1a1 1 0 0 0-1.3-1.2 6.6 6.6 0 1 0 9.7 9.7 1 1 0 0 0-1.2-1.3Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}
