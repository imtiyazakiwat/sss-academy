"use client";

import {
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import { cn } from "@/lib/cn";

export type SplitAxis = "x" | "y";

interface ResizableOptions {
  /** localStorage key. Sizes are per-workspace, not per-lab. */
  storageKey: string;
  /** Size in px used on first visit and on double-click reset. */
  initial: number;
  min: number;
  /** A function is re-evaluated on every drag frame, so it can track the viewport. */
  max: number | (() => number);
  axis: SplitAxis;
  /** True when the pane grows as the pointer moves up or left (bottom dock, right rail). */
  invert?: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/* ------------------------------------------------------------------ *
 * Persisted sizes
 * ------------------------------------------------------------------ *
 * localStorage is an external store, so it is read through
 * useSyncExternalStore rather than copied into state by an effect. React then
 * handles the server-to-client handover itself: the default renders on the
 * server, the stored size takes over at hydration, and there is no cascading
 * render and no mismatch to suppress.
 */

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function subscribeToSizes(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab moving a splitter should move it here too.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readStoredSize(key: string, fallback: number): number {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredSize(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(Math.round(value)));
  } catch {
    // Private browsing: the pane still resizes, only the memory is lost.
  }
  notify();
}

/**
 * Pane sizing for the workspace splitters.
 *
 * The size lives in React state but is written to the DOM through a style prop
 * on the pane, so a drag is one state update per frame rather than a layout
 * measurement per frame. Pointer capture means the drag survives the cursor
 * leaving the 6px handle, which is what makes fast drags feel solid.
 */
export function useResizable({
  storageKey,
  initial,
  min,
  max,
  axis,
  invert = false,
}: ResizableOptions) {
  const stored = useSyncExternalStore(
    subscribeToSizes,
    () => readStoredSize(storageKey, initial),
    () => initial,
  );
  // During a drag the size is local: writing to storage 60 times a second to
  // move a divider would be absurd. It is persisted once, on release.
  const [live, setLive] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const origin = useRef({ pointer: 0, size: 0 });

  const resolveMax = useCallback(
    () => (typeof max === "function" ? max() : max),
    [max],
  );

  const size = clamp(live ?? stored, min, resolveMax());

  const commit = useCallback(
    (next: number) => {
      const bounded = clamp(next, min, resolveMax());
      writeStoredSize(storageKey, bounded);
      // Hand ownership back to storage. Holding on to `live` would pin the pane
      // to its last local value and quietly deafen it to the storage event, so
      // another tab could never move it again.
      setLive(null);
    },
    [min, resolveMax, storageKey],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      origin.current = {
        pointer: axis === "x" ? event.clientX : event.clientY,
        size,
      };
      setDragging(true);
    },
    [axis, size],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      const pointer = axis === "x" ? event.clientX : event.clientY;
      const delta = pointer - origin.current.pointer;
      setLive(
        clamp(
          origin.current.size + (invert ? -delta : delta),
          min,
          resolveMax(),
        ),
      );
    },
    [axis, dragging, invert, min, resolveMax],
  );

  const endDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (dragging) {
        writeStoredSize(storageKey, size);
        setLive(null);
      }
      setDragging(false);
    },
    [dragging, size, storageKey],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const decrease = axis === "x" ? "ArrowLeft" : "ArrowUp";
      const increase = axis === "x" ? "ArrowRight" : "ArrowDown";
      const step = invert ? -16 : 16;

      if (event.key === decrease) {
        event.preventDefault();
        commit(size - step);
      } else if (event.key === increase) {
        event.preventDefault();
        commit(size + step);
      } else if (event.key === "PageUp") {
        event.preventDefault();
        commit(size - step * 4);
      } else if (event.key === "PageDown") {
        event.preventDefault();
        commit(size + step * 4);
      } else if (event.key === "Home") {
        event.preventDefault();
        commit(invert ? resolveMax() : min);
      } else if (event.key === "End") {
        event.preventDefault();
        commit(invert ? min : resolveMax());
      } else if (event.key === "Enter") {
        event.preventDefault();
        commit(initial);
      }
    },
    [axis, commit, initial, invert, min, resolveMax, size],
  );

  const reset = useCallback(() => commit(initial), [commit, initial]);

  return {
    size,
    dragging,
    setSize: commit,
    reset,
    handleProps: {
      axis,
      dragging,
      valueNow: Math.round(size),
      valueMin: min,
      valueMax: Math.round(resolveMax()),
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onKeyDown,
      onDoubleClick: reset,
    },
  };
}

export interface SplitterProps {
  axis: SplitAxis;
  dragging: boolean;
  valueNow: number;
  valueMin: number;
  valueMax: number;
  label: string;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onDoubleClick: () => void;
  className?: string;
}

/**
 * The drag handle itself. 3px of visible line with an 11px hit area straddling
 * it, so it is comfortable to grab without stealing space from either pane.
 * Focusable and arrow-key operable — a splitter that only responds to a mouse
 * locks keyboard users out of the layout entirely.
 */
export function Splitter({
  axis,
  dragging,
  valueNow,
  valueMin,
  valueMax,
  label,
  className,
  ...handlers
}: SplitterProps) {
  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={axis === "x" ? "vertical" : "horizontal"}
      aria-label={label}
      aria-valuenow={valueNow}
      aria-valuemin={valueMin}
      aria-valuemax={valueMax}
      {...handlers}
      className={cn(
        "group relative z-20 shrink-0 touch-none",
        axis === "x"
          ? "-mx-[4px] w-[9px] cursor-col-resize"
          : "-my-[4px] h-[9px] cursor-row-resize",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute transition-colors duration-150",
          axis === "x"
            ? "inset-y-0 left-1/2 w-px -translate-x-1/2"
            : "inset-x-0 top-1/2 h-px -translate-y-1/2",
          dragging
            ? "bg-pg-primary"
            : "bg-pg-line group-hover:bg-pg-primary group-focus-visible:bg-pg-primary",
        )}
      />
      {/* Grip dots, shown on hover so the handle is discoverable. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-[3px] opacity-0 transition-opacity duration-150 group-hover:opacity-100",
          axis === "x" && "flex-col",
          dragging && "opacity-100",
        )}
      >
        <span className="size-[2px] rounded-full bg-pg-primary" />
        <span className="size-[2px] rounded-full bg-pg-primary" />
        <span className="size-[2px] rounded-full bg-pg-primary" />
      </span>
    </div>
  );
}
