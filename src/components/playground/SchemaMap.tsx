"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import {
  CanvasControls,
  CanvasStage,
  type CanvasHandle,
  type FrameSize,
  type Viewport,
} from "@/components/playground/CanvasStage";
import { useDb } from "@/components/playground/DbProvider";
import { useDatabaseMap } from "@/components/playground/useDatabaseMap";
import {
  edgeAnchors,
  edgePath,
  layoutDatabase,
  SESSION_GROUP,
  type DatabaseMap,
  type DbEdge,
  type DbTable,
  type LaidOutTable,
} from "@/lib/db-map";
import { cn } from "@/lib/cn";

const POSITION_KEY = "sss-pg-map-positions";

type Positions = Record<string, { x: number; y: number }>;

/* Saved card positions, read as an external store — same reasoning as the
 * splitter sizes: no effect copying storage into state, and the parsed object is
 * cached so the snapshot keeps a stable identity between renders. */

const EMPTY_POSITIONS: Positions = {};
const positionListeners = new Set<() => void>();
let positionCache: { raw: string | null; value: Positions } = {
  raw: null,
  value: EMPTY_POSITIONS,
};

function subscribeToPositions(listener: () => void): () => void {
  positionListeners.add(listener);
  return () => positionListeners.delete(listener);
}

function readPositions(): Positions {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (raw !== positionCache.raw) {
      positionCache = {
        raw,
        value: raw ? (JSON.parse(raw) as Positions) : EMPTY_POSITIONS,
      };
    }
    return positionCache.value;
  } catch {
    return EMPTY_POSITIONS;
  }
}

function writePositions(value: Positions): void {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify(value));
  } catch {
    // Layout still applies for this session.
  }
  positionCache = { raw: JSON.stringify(value), value };
  for (const listener of positionListeners) listener();
}

const EDGE_STYLE: Record<
  DbEdge["kind"],
  { stroke: string; dash?: string; label: string }
> = {
  declared: { stroke: "var(--pg-primary)", label: "Foreign key" },
  inferred: { stroke: "var(--pg-iris)", dash: "6 5", label: "Inferred by key name" },
  flow: { stroke: "var(--pg-sky)", dash: "2 6", label: "ETL lineage" },
};

/** Tables named anywhere in a statement — good enough to light up what it touched. */
function tablesInSql(sql: string | null, names: string[]): Set<string> {
  if (!sql) return new Set();
  const lowered = sql.toLowerCase();
  const hits = new Set<string>();
  for (const name of names) {
    if (new RegExp(`\\b${name.toLowerCase()}\\b`).test(lowered)) hits.add(name);
  }
  return hits;
}

/**
 * The database, drawn.
 *
 * Cards are live: columns, keys, row counts and relationships all come from
 * PRAGMA reads through `useDatabaseMap`, so this is the current schema rather
 * than a picture of the seed. Declared foreign keys are solid; relationships
 * merely implied by a matching key name are dashed and labelled as inferred,
 * because a diagram that presents a guess as a constraint teaches the wrong
 * thing.
 */
export function SchemaMap({
  onQuery,
  onPeek,
  tableFilter,
  onSelectionChange,
  toolbarNote,
  actions,
  embedded = false,
  className,
}: {
  /** Called with a ready-made SELECT for the lab's editor. */
  onQuery?: (sql: string, table: string) => void;
  /** Called to show a table's rows in the dock without leaving the canvas. */
  onPeek?: (table: string) => void;
  /** Narrows the map to part of the schema — the star schema lab uses this. */
  tableFilter?: (table: DbTable) => boolean;
  onSelectionChange?: (table: string | null) => void;
  toolbarNote?: string;
  /** Extra controls for the toolbar, e.g. the snowflake toggle. */
  actions?: ReactNode;
  /** True when the map sits inside a scrolling lab rather than owning the stage. */
  embedded?: boolean;
  className?: string;
}) {
  const { lastSql, runCount } = useDb();
  const { map: fullMap, layout: fullLayout } = useDatabaseMap();

  // Filtering happens before layout so lanes close up rather than leaving holes.
  const { map, layout } = useMemo(() => {
    if (!tableFilter) return { map: fullMap, layout: fullLayout };
    const tables = fullMap.tables.filter(tableFilter);
    const names = new Set(tables.map((table) => table.name));
    const filtered: DatabaseMap = {
      tables,
      edges: fullMap.edges.filter(
        (edge) => names.has(edge.from) && names.has(edge.to),
      ),
    };
    return { map: filtered, layout: layoutDatabase(filtered) };
  }, [fullLayout, fullMap, tableFilter]);
  const canvas = useRef<CanvasHandle>(null);

  const [viewport, setViewport] = useState<Viewport>({ z: 1, x: 0, y: 0 });
  const [frame, setFrame] = useState<FrameSize>({ width: 0, height: 0 });
  const storedPositions = useSyncExternalStore(
    subscribeToPositions,
    readPositions,
    () => EMPTY_POSITIONS,
  );
  /** Live drag positions; folded into storage when the pointer is released. */
  const [dragged, setDragged] = useState<Positions | null>(null);
  const positions = dragged ?? storedPositions;
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<{
    table: string;
    column: string;
  } | null>(null);
  const [query, setQuery] = useState("");

  const drag = useRef<{
    table: string;
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const persist = useCallback((next: Positions) => {
    writePositions(next);
    setDragged(null);
  }, []);

  // Dragged cards override the lane layout; everything else stays where the
  // layout put it, so a moved card does not reshuffle its neighbours.
  const nodes = useMemo<LaidOutTable[]>(
    () =>
      layout.nodes.map((node) => {
        const override = positions[node.name];
        return override ? { ...node, x: override.x, y: override.y } : node;
      }),
    [layout.nodes, positions],
  );

  const nodeByName = useMemo(
    () => new Map(nodes.map((node) => [node.name, node])),
    [nodes],
  );

  const bounds = useMemo(() => {
    let width = layout.width;
    let height = layout.height;
    for (const node of nodes) {
      width = Math.max(width, node.x + node.width + 56);
      height = Math.max(height, node.y + node.height + 56);
    }
    return { width, height };
  }, [layout.height, layout.width, nodes]);

  const touched = useMemo(
    () => tablesInSql(lastSql, map.tables.map((table) => table.name)),
    // runCount makes a repeat of the same statement re-trigger the pulse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lastSql, runCount, map.tables],
  );

  // A filter change can strip the selected table out from under us, so validity
  // is derived rather than corrected after the fact.
  const active =
    selected && map.tables.some((table) => table.name === selected)
      ? selected
      : null;
  const focus = active ?? hovered;

  /** Tables one edge away from the focused one, for the dimming pass. */
  const related = useMemo(() => {
    if (!focus) return null;
    const set = new Set<string>([focus]);
    for (const edge of map.edges) {
      if (edge.from === focus) set.add(edge.to);
      if (edge.to === focus) set.add(edge.from);
    }
    return set;
  }, [focus, map.edges]);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return null;
    return new Set(
      map.tables
        .filter(
          (table) =>
            table.name.toLowerCase().includes(term) ||
            table.columns.some((column) =>
              column.name.toLowerCase().includes(term),
            ),
        )
        .map((table) => table.name),
    );
  }, [map.tables, query]);

  const startDrag = (
    event: ReactPointerEvent<HTMLElement>,
    node: LaidOutTable,
  ) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    drag.current = {
      table: node.name,
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: node.x,
      startY: node.y,
    };
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current) return;
    // Divide by zoom so the card tracks the cursor exactly at any scale.
    const dx = (event.clientX - current.pointerX) / viewport.z;
    const dy = (event.clientY - current.pointerY) / viewport.z;
    setDragged((previous) => ({
      ...(previous ?? storedPositions),
      [current.table]: {
        x: Math.round(current.startX + dx),
        y: Math.round(current.startY + dy),
      },
    }));
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!drag.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
    if (dragged) persist(dragged);
  };

  const select = useCallback(
    (name: string | null) => {
      setSelected(name);
      onSelectionChange?.(name);
    },
    [onSelectionChange],
  );

  const jumpTo = (name: string) => {
    const node = nodeByName.get(name);
    if (!node) return;
    select(name);
    canvas.current?.centreOn(
      node.x + node.width / 2,
      node.y + node.height / 2,
      Math.max(viewport.z, 0.85),
    );
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-pg-bg", className)}>
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-pg-line bg-pg-surface px-3 py-2">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a table or column"
            aria-label="Find a table or column"
            className="h-8 w-52 rounded-full border border-pg-line bg-pg-raised pr-3 pl-8 text-[0.8125rem] text-pg-text outline-none transition-colors placeholder:text-pg-faint focus:border-pg-primary"
          />
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-pg-faint"
            fill="none"
          >
            <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="m12.5 12.5 4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {matches ? (
          <div className="pg-scroll flex max-w-md items-center gap-1 overflow-x-auto">
            {[...matches].slice(0, 8).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => jumpTo(name)}
                className="shrink-0 rounded-full bg-pg-primary-soft px-2.5 py-1 font-mono text-[0.6875rem] text-pg-primary transition-colors hover:bg-pg-primary hover:text-pg-on-primary"
              >
                {name}
              </button>
            ))}
            {matches.size === 0 ? (
              <span className="text-[0.6875rem] text-pg-faint">No match</span>
            ) : null}
          </div>
        ) : (
          <p className="hidden text-[0.6875rem] text-pg-faint sm:block">
            {toolbarNote ??
              "Drag a card to arrange · scroll to pan · ⌘/ctrl + scroll to zoom"}
          </p>
        )}

        {actions}

        <div className="ml-auto flex items-center gap-3">
          <Legend />
          <span className="font-mono text-[0.6875rem] text-pg-dim">
            {map.tables.length} tables · {map.edges.length} links
          </span>
        </div>
      </div>

      <CanvasStage
        handleRef={canvas}
        contentWidth={bounds.width}
        contentHeight={bounds.height}
        onViewportChange={(next, size) => {
          setViewport(next);
          setFrame(size);
        }}
        wheelPan={!embedded}
        openFloor={0.68}
        ariaLabel="Database schema map. Use the table list to move focus, or drag to pan."
        className="min-h-0 flex-1"
        overlay={
          <>
            <CanvasControls
              zoom={viewport.z}
              onZoomIn={() => canvas.current?.zoomBy(1.2)}
              onZoomOut={() => canvas.current?.zoomBy(1 / 1.2)}
              onFit={() => canvas.current?.fit(bounds)}
              onReset={() => canvas.current?.reset()}
              className="absolute right-3 bottom-3"
            />
            <Minimap
              nodes={nodes}
              bounds={bounds}
              viewport={viewport}
              frame={frame}
              focus={focus}
              className="absolute bottom-3 left-3"
            />
            {Object.keys(positions).length > 0 ? (
              <button
                type="button"
                onClick={() => persist({})}
                className="absolute top-3 right-3 rounded-full border border-pg-line bg-pg-surface/95 px-3 py-1.5 text-[0.6875rem] text-pg-dim backdrop-blur transition-colors hover:text-pg-text"
              >
                Reset layout
              </button>
            ) : null}
          </>
        }
      >
        {/* Edges sit under the cards and never take a click. */}
        <svg
          width={bounds.width}
          height={bounds.height}
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          {map.edges.map((edge) => {
            const from = nodeByName.get(edge.from);
            const to = nodeByName.get(edge.to);
            if (!from || !to) return null;

            const style = EDGE_STYLE[edge.kind];
            const anchors = edgeAnchors(from, to, edge.fromColumn || undefined);
            const isFocused =
              focus === edge.from ||
              focus === edge.to ||
              (activeColumn?.table === edge.from &&
                activeColumn.column === edge.fromColumn);
            const dimmed = Boolean(focus) && !isFocused;

            return (
              <g
                key={edge.id}
                style={{
                  opacity: dimmed ? 0.12 : isFocused ? 1 : 0.55,
                  transition: "opacity 220ms var(--ease-out-expo)",
                }}
              >
                <path
                  d={edgePath(anchors)}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={isFocused ? 2.2 : 1.4}
                  strokeDasharray={style.dash}
                  strokeLinecap="round"
                />
                <circle cx={anchors.x2} cy={anchors.y2} r={3} fill={style.stroke} />
                {isFocused && edge.label ? (
                  <text
                    x={(anchors.x1 + anchors.x2) / 2}
                    y={(anchors.y1 + anchors.y2) / 2 - 6}
                    textAnchor="middle"
                    className="font-mono"
                    style={{ fontSize: 10, fill: style.stroke }}
                  >
                    {edge.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>

        {layout.lanes.map((lane) => (
          <p
            key={lane.label}
            data-canvas-background=""
            className={cn(
              "absolute text-[0.6875rem] font-semibold tracking-[0.12em] uppercase",
              lane.label === SESSION_GROUP ? "text-pg-primary" : "text-pg-faint",
            )}
            style={{
              left: lane.x,
              top: 60,
              width: lane.width,
              // Counter-scaled so the lane still reads at fit-to-view zoom.
              fontSize: Math.min(11 / viewport.z, 20),
            }}
          >
            {lane.label}
          </p>
        ))}

        {nodes.map((node) => (
          <TableCard
            key={node.name}
            node={node}
            zoom={viewport.z}
            selected={active === node.name}
            dimmed={Boolean(related) && !related?.has(node.name)}
            faded={Boolean(matches) && !matches?.has(node.name)}
            touched={touched.has(node.name)}
            runCount={runCount}
            activeColumn={
              activeColumn?.table === node.name ? activeColumn.column : null
            }
            onSelect={() => select(active === node.name ? null : node.name)}
            onHover={setHovered}
            onColumn={(column) =>
              setActiveColumn((current) =>
                current?.table === node.name && current.column === column
                  ? null
                  : { table: node.name, column },
              )
            }
            onQuery={onQuery}
            onPeek={onPeek}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
          />
        ))}
      </CanvasStage>
    </div>
  );
}

function Legend() {
  return (
    <ul className="hidden items-center gap-3 lg:flex">
      {(["declared", "inferred", "flow"] as const).map((kind) => {
        const style = EDGE_STYLE[kind];
        return (
          <li key={kind} className="flex items-center gap-1.5">
            <svg viewBox="0 0 18 6" aria-hidden="true" className="h-1.5 w-4">
              <path
                d="M0 3h18"
                stroke={style.stroke}
                strokeWidth="2"
                strokeDasharray={style.dash}
              />
            </svg>
            <span className="text-[0.6875rem] text-pg-faint">{style.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

function TableCard({
  node,
  zoom,
  selected,
  dimmed,
  faded,
  touched,
  runCount,
  activeColumn,
  onSelect,
  onHover,
  onColumn,
  onQuery,
  onPeek,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  node: LaidOutTable;
  zoom: number;
  selected: boolean;
  dimmed: boolean;
  faded: boolean;
  touched: boolean;
  runCount: number;
  activeColumn: string | null;
  onSelect: () => void;
  onHover: (table: string | null) => void;
  onColumn: (column: string) => void;
  onQuery?: (sql: string, table: string) => void;
  onPeek?: (table: string) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>, node: LaidOutTable) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
}) {
  /**
   * Below this zoom the column list is a grey smear, so the card drops to name
   * and row count at a counter-scaled size instead. Same trade every design tool
   * makes: an overview should be readable as an overview.
   */
  const compact = zoom < 0.62;
  const titleSize = compact ? Math.min(13 / zoom, 24) : 13;

  return (
    <article
      onMouseEnter={() => onHover(node.name)}
      onMouseLeave={() => onHover(null)}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        minHeight: node.height,
        opacity: dimmed || faded ? 0.28 : 1,
      }}
      className={cn(
        "absolute flex flex-col overflow-hidden rounded-xl border bg-pg-node transition-[opacity,border-color,box-shadow] duration-200",
        selected
          ? "border-pg-primary shadow-[0_0_0_3px_var(--pg-primary-soft)]"
          : "border-pg-line hover:border-pg-line-strong",
        !node.seeded && !selected && "border-pg-primary/45",
        touched && "animate-pg-touch",
      )}
      // Re-keying the animation on each run is what makes a repeated statement
      // pulse again rather than sit there already-animated.
      key={`${node.name}-${touched ? runCount : "idle"}`}
    >
      <header
        onPointerDown={(event) => onPointerDown(event, node)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="shrink-0 cursor-grab touch-none border-b border-pg-line bg-pg-raised px-2.5 py-2 active:cursor-grabbing"
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSelect}
            style={{ fontSize: titleSize }}
            className="min-w-0 flex-1 text-left font-mono font-medium text-pg-text hover:text-pg-primary"
          >
            <span className="block truncate">{node.name}</span>
          </button>
          {node.kind === "view" && !compact ? (
            <span className="shrink-0 rounded bg-pg-iris-soft px-1.5 py-0.5 text-[0.5625rem] font-semibold tracking-[0.08em] text-pg-iris uppercase">
              view
            </span>
          ) : null}
          {!node.seeded ? (
            <span className="shrink-0 rounded bg-pg-primary-soft px-1.5 py-0.5 text-[0.5625rem] font-semibold tracking-[0.08em] text-pg-primary uppercase">
              new
            </span>
          ) : null}
          <span
            style={{ fontSize: compact ? Math.min(10 / zoom, 18) : 10 }}
            className="shrink-0 font-mono text-pg-dim tabular-nums"
          >
            {node.rows.toLocaleString("en-IN")}
          </span>
        </div>

        {selected ? (
          <div className="animate-pg-fade-in mt-1.5 flex gap-1">
            {onQuery ? (
              <button
                type="button"
                onClick={() =>
                  onQuery(`SELECT * FROM ${node.name};`, node.name)
                }
                className="rounded bg-pg-primary px-2 py-0.5 text-[0.625rem] font-medium text-pg-on-primary transition-colors hover:bg-pg-primary-hover"
              >
                To editor
              </button>
            ) : null}
            {onPeek ? (
              <button
                type="button"
                onClick={() => onPeek(node.name)}
                className="rounded border border-pg-line px-2 py-0.5 text-[0.625rem] font-medium text-pg-dim transition-colors hover:text-pg-text"
              >
                Peek rows
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      <ul className={cn("flex-1 py-1.5", compact && "hidden")}>
        {node.visibleColumns.map((column) => {
          const active = activeColumn === column.name;
          return (
            <li key={column.name}>
              <button
                type="button"
                onClick={() => onColumn(column.name)}
                className={cn(
                  "flex w-full items-baseline gap-1.5 px-2.5 py-px text-left font-mono text-[0.6875rem] transition-colors",
                  active ? "bg-pg-primary-soft" : "hover:bg-pg-hover",
                )}
              >
                {column.pk ? (
                  <span
                    title="Primary key"
                    aria-label="Primary key"
                    className="shrink-0 text-pg-gold"
                  >
                    ◆
                  </span>
                ) : column.references ? (
                  <span
                    title={`References ${column.references.table}.${column.references.column}`}
                    aria-label="Foreign key"
                    className="shrink-0 text-pg-primary"
                  >
                    ◇
                  </span>
                ) : (
                  <span aria-hidden="true" className="shrink-0 text-transparent">
                    ·
                  </span>
                )}
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    column.pk
                      ? "text-pg-gold"
                      : column.references
                        ? "text-pg-text"
                        : "text-pg-dim",
                  )}
                >
                  {column.name}
                </span>
                <span className="shrink-0 text-[0.5625rem] text-pg-faint">
                  {column.type || "—"}
                </span>
              </button>
            </li>
          );
        })}

        {node.hiddenColumns > 0 ? (
          <li className="px-2.5 pt-0.5 font-mono text-[0.625rem] text-pg-faint">
            +{node.hiddenColumns} more
          </li>
        ) : null}
      </ul>
    </article>
  );
}

/**
 * Minimap. Worth the code on a map this wide: at 40% zoom the lanes run well
 * past the viewport, and without it panning becomes guesswork.
 */
function Minimap({
  nodes,
  bounds,
  viewport,
  frame,
  focus,
  className,
}: {
  nodes: LaidOutTable[];
  bounds: { width: number; height: number };
  viewport: Viewport;
  frame: FrameSize;
  focus: string | null;
  className?: string;
}) {
  const WIDTH = 132;
  const scale = WIDTH / bounds.width;
  const height = Math.max(46, bounds.height * scale);

  // The slice of the canvas currently on screen, in canvas units.
  const view = {
    x: (-viewport.x / viewport.z) * scale,
    y: (-viewport.y / viewport.z) * scale,
    width: (frame.width / viewport.z) * scale,
    height: (frame.height / viewport.z) * scale,
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "overflow-hidden rounded-lg border border-pg-line bg-pg-surface/90 p-1 backdrop-blur",
        className,
      )}
      style={{ width: WIDTH + 8 }}
    >
      <svg width={WIDTH} height={height} className="block">
        {nodes.map((node) => (
          <rect
            key={node.name}
            x={node.x * scale}
            y={node.y * scale}
            width={node.width * scale}
            height={node.height * scale}
            rx={1.5}
            fill={
              focus === node.name
                ? "var(--pg-primary)"
                : node.seeded
                  ? "var(--pg-line-strong)"
                  : "var(--pg-primary-soft)"
            }
          />
        ))}

        {frame.width > 0 ? (
          <rect
            x={view.x}
            y={view.y}
            width={view.width}
            height={view.height}
            fill="none"
            stroke="var(--pg-primary)"
            strokeWidth="1"
          />
        ) : null}
      </svg>
    </div>
  );
}
