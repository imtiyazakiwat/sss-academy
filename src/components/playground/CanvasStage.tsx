"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";

import { cn } from "@/lib/cn";

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2.5;

export interface Viewport {
  /** Scale factor. 1 = 100%. */
  z: number;
  /** Translation in screen pixels, applied before the scale. */
  x: number;
  y: number;
}

export interface FrameSize {
  width: number;
  height: number;
}

export interface CanvasHandle {
  /**
   * Fits the given content box, in canvas units, into the viewport. `floor`
   * refuses to zoom out past a readable scale, anchoring top-left instead.
   */
  fit: (box?: { width: number; height: number }, floor?: number) => void;
  reset: () => void;
  zoomBy: (factor: number) => void;
  /** Centres a point given in canvas units, optionally changing zoom. */
  centreOn: (x: number, y: number, z?: number) => void;
}

function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

/**
 * Pan-and-zoom stage.
 *
 * Hand-rolled rather than a canvas library: the content is ordinary DOM, so it
 * stays selectable, focusable and screen-reader navigable, and a single
 * `transform` on one layer is all the GPU needs. A library would have brought a
 * bespoke event model and its own accessibility problem for no gain at this size.
 *
 * Gesture model matches design tools:
 *   wheel                → pan
 *   ctrl/cmd + wheel     → zoom at the cursor (this is also how a trackpad pinch arrives)
 *   space-drag / middle  → pan
 *   drag on empty canvas → pan
 */
export function CanvasStage({
  children,
  contentWidth,
  contentHeight,
  handleRef,
  onViewportChange,
  className,
  overlay,
  ariaLabel,
  wheelPan = true,
  openFloor = 0,
}: {
  children: ReactNode;
  contentWidth: number;
  contentHeight: number;
  handleRef?: Ref<CanvasHandle>;
  /** Reports the frame size alongside the transform, for minimaps. */
  onViewportChange?: (viewport: Viewport, frame: FrameSize) => void;
  className?: string;
  /** Rendered above the transformed layer, in screen space. */
  overlay?: ReactNode;
  ariaLabel: string;
  /**
   * Whether a plain wheel pans the canvas. Off for a canvas embedded in a
   * scrolling page: swallowing the wheel there would trap the reader, so plain
   * scrolling passes through and only ctrl/pinch zoom is captured.
   */
  wheelPan?: boolean;
  /** Minimum zoom for the opening fit. 0 fits everything, however small. */
  openFloor?: number;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>({ z: 1, x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const panOrigin = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  /**
   * The authoritative transform, mirrored out of state.
   *
   * Gestures need the current value synchronously — a wheel burst delivers
   * several events before React re-renders — and the alternative, computing
   * inside a `setViewport(current => …)` updater, is what previously let the
   * parent's `onViewportChange` fire during render: React runs updaters while
   * rendering, so notifying from inside one is a setState in another component's
   * render pass. The ref keeps the maths synchronous and the notification in the
   * event handler where it belongs.
   */
  const current = useRef<Viewport>({ z: 1, x: 0, y: 0 });

  // Held in a ref so the wheel listener does not resubscribe whenever the
  // parent passes a fresh inline callback.
  const report = useRef(onViewportChange);
  useEffect(() => {
    report.current = onViewportChange;
  }, [onViewportChange]);

  const frameSize = useCallback((): FrameSize => {
    const frame = frameRef.current;
    return {
      width: frame?.clientWidth ?? 0,
      height: frame?.clientHeight ?? 0,
    };
  }, []);

  const update = useCallback(
    (next: Viewport) => {
      current.current = next;
      setViewport(next);
      report.current?.(next, frameSize());
    },
    [frameSize],
  );

  const fit = useCallback(
    (box?: { width: number; height: number }, floor = 0) => {
      const frame = frameRef.current;
      if (!frame) return;
      const width = box?.width ?? contentWidth;
      const height = box?.height ?? contentHeight;
      const rect = frame.getBoundingClientRect();
      const padding = 48;
      const exact = Math.min(
        (rect.width - padding * 2) / width,
        (rect.height - padding * 2) / height,
      );

      // A floor is used for the opening view: eighteen tables genuinely do not
      // fit legibly in a 500px pane, and a first impression of grey rectangles
      // is worse than starting in the corner where the cards can be read.
      const z = clampZoom(Math.max(exact, floor));
      const centred = z <= exact + 0.001;

      update({
        z,
        x: centred ? (rect.width - width * z) / 2 : padding,
        y: centred ? (rect.height - height * z) / 2 : padding,
      });
    },
    [contentHeight, contentWidth, update],
  );

  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      const frame = frameRef.current;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      const px = (clientX ?? rect.left + rect.width / 2) - rect.left;
      const py = (clientY ?? rect.top + rect.height / 2) - rect.top;

      const from = current.current;
      const z = clampZoom(from.z * factor);
      if (z === from.z) return;

      // Keep the canvas point under the cursor fixed while the scale changes.
      const ratio = z / from.z;
      update({
        z,
        x: px - (px - from.x) * ratio,
        y: py - (py - from.y) * ratio,
      });
    },
    [update],
  );

  useImperativeHandle(
    handleRef,
    () => ({
      fit,
      reset: () => {
        const frame = frameRef.current;
        if (!frame) return;
        const rect = frame.getBoundingClientRect();
        update({
          z: 1,
          x: (rect.width - contentWidth) / 2,
          y: 24,
        });
      },
      zoomBy: (factor: number) => zoomAt(factor),
      centreOn: (x: number, y: number, z?: number) => {
        const frame = frameRef.current;
        if (!frame) return;
        const rect = frame.getBoundingClientRect();
        const zoom = clampZoom(z ?? current.current.z);
        update({
          z: zoom,
          x: rect.width / 2 - x * zoom,
          y: rect.height / 2 - y * zoom,
        });
      },
    }),
    [contentWidth, fit, update, zoomAt],
  );

  // Fit once, as soon as the frame has a measurable size.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (frame.clientWidth > 0) {
      fit(undefined, openFloor);
      return;
    }
    const observer = new ResizeObserver((entries) => {
      if (entries[0].contentRect.width > 0) {
        observer.disconnect();
        fit(undefined, openFloor);
      }
    });
    observer.observe(frame);
    return () => observer.disconnect();
    // Deliberately once per mount: re-fitting on every content change would
    // fight the learner's own pan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wheel has to be a non-passive native listener; React's synthetic wheel is
  // passive, so preventDefault there would be ignored and the page would scroll.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        zoomAt(Math.exp(-event.deltaY * 0.0022), event.clientX, event.clientY);
        return;
      }
      if (!wheelPan) return;
      event.preventDefault();
      const from = current.current;
      update({
        z: from.z,
        x: from.x - event.deltaX,
        y: from.y - event.deltaY,
      });
    };

    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, [update, wheelPan, zoomAt]);

  // Space-to-pan and the zoom shortcuts, scoped to a focused canvas so they
  // never fight the SQL editor next door.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const owns = (target: EventTarget | null) =>
      target instanceof Node && frame.contains(target);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && owns(document.activeElement)) {
        event.preventDefault();
        setSpaceHeld(true);
        return;
      }
      if (!(event.metaKey || event.ctrlKey)) return;
      if (!owns(document.activeElement)) return;

      if (event.key === "0") {
        event.preventDefault();
        fit();
      } else if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        zoomAt(1.2);
      } else if (event.key === "-") {
        event.preventDefault();
        zoomAt(1 / 1.2);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") setSpaceHeld(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [fit, zoomAt]);

  const startPan = (event: React.PointerEvent<HTMLDivElement>) => {
    // The frame and the transform layer both count as background: a drag on the
    // empty part of the canvas should pan wherever it starts, but a drag that
    // begins on a card belongs to that card.
    const target = event.target as HTMLElement;
    const isBackground =
      target === event.currentTarget || target.dataset.canvasBackground === "";
    const wantsPan = event.button === 1 || spaceHeld || isBackground;
    if (!wantsPan) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    panOrigin.current = {
      x: event.clientX,
      y: event.clientY,
      vx: current.current.x,
      vy: current.current.y,
    };
    setPanning(true);
  };

  return (
    <div
      ref={frameRef}
      tabIndex={0}
      role="application"
      aria-label={ariaLabel}
      className={cn(
        "pg-grid relative overflow-hidden bg-pg-canvas outline-none focus-visible:ring-1 focus-visible:ring-pg-primary focus-visible:ring-inset",
        panning ? "cursor-grabbing" : spaceHeld ? "cursor-grab" : "cursor-default",
        className,
      )}
      style={{
        // The grid scrolls and scales with the content, which is what sells the
        // canvas as a surface rather than a scrolling div.
        backgroundSize: `${24 * viewport.z}px ${24 * viewport.z}px`,
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      }}
      onPointerDown={startPan}
      onPointerMove={(event) => {
        if (!panning) return;
        update({
          z: current.current.z,
          x: panOrigin.current.vx + (event.clientX - panOrigin.current.x),
          y: panOrigin.current.vy + (event.clientY - panOrigin.current.y),
        });
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        setPanning(false);
      }}
      onPointerCancel={() => setPanning(false)}
    >
      <div
        data-canvas-background=""
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: contentWidth,
          height: contentHeight,
          transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.z})`,
        }}
      >
        {children}
      </div>

      {overlay}
    </div>
  );
}

/** Zoom readout and controls, styled to sit in a canvas corner. */
export function CanvasControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
  className,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-pg-line bg-pg-surface/95 p-1 shadow-lift backdrop-blur",
        className,
      )}
    >
      <CanvasButton onClick={onZoomOut} label="Zoom out" disabled={zoom <= MIN_ZOOM}>
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
          <path
            d="M4 8h8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </CanvasButton>

      <button
        type="button"
        onClick={onReset}
        title="Reset to 100%"
        className="min-w-11 rounded-full px-1.5 py-1 font-mono text-[0.6875rem] text-pg-dim transition-colors hover:bg-pg-hover hover:text-pg-text"
      >
        {Math.round(zoom * 100)}%
      </button>

      <CanvasButton onClick={onZoomIn} label="Zoom in" disabled={zoom >= MAX_ZOOM}>
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
          <path
            d="M8 4v8M4 8h8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </CanvasButton>

      <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-pg-line" />

      <CanvasButton onClick={onFit} label="Fit to view">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
          <path
            d="M2.5 6V3.5a1 1 0 0 1 1-1H6M10 2.5h2.5a1 1 0 0 1 1 1V6M13.5 10v2.5a1 1 0 0 1-1 1H10M6 13.5H3.5a1 1 0 0 1-1-1V10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </CanvasButton>
    </div>
  );
}

function CanvasButton({
  children,
  onClick,
  label,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="flex size-7 items-center justify-center rounded-full text-pg-dim transition-colors hover:bg-pg-hover hover:text-pg-text disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
