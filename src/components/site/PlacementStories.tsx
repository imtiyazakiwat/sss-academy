"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { PlacementCard } from "@/components/site/PlacementCard";
import type { Placement } from "@/content/placements";
import { cn } from "@/lib/cn";

type Filter = "all" | "automation" | "data";

const PAGE_SIZE = 6;

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All stories" },
  { value: "automation", label: "ETL & automation" },
  { value: "data", label: "Data testing" },
];

function categoryFor(placement: Placement): Exclude<Filter, "all"> {
  return placement.role.toLowerCase().includes("big data")
    ? "data"
    : "automation";
}

export function PlacementStories({ stories }: { stories: Placement[] }) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const loadSentinelRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return stories.filter((story) => {
      const matchesFilter =
        filter === "all" || categoryFor(story) === filter;
      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;

      const searchable = [
        story.name,
        story.role,
        story.location ?? "",
        story.quote,
        String(story.packageLpa),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [filter, query, stories]);

  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visible.length;

  useEffect(() => {
    const sentinel = loadSentinelRef.current;
    if (!sentinel || remaining <= 0) return;

    if (!("IntersectionObserver" in window)) {
      const fallbackTimer = globalThis.setTimeout(
        () => setVisibleCount(filtered.length),
        0,
      );
      return () => globalThis.clearTimeout(fallbackTimer);
    }

    let timer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        observer.disconnect();
        setIsLoading(true);
        timer = window.setTimeout(() => {
          setVisibleCount((count) =>
            Math.min(count + PAGE_SIZE, filtered.length),
          );
          setIsLoading(false);
        }, 480);
      },
      { rootMargin: "320px 0px", threshold: 0.01 },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [filter, filtered.length, query, remaining]);

  const selectFilter = (next: Filter) => {
    setFilter(next);
    setVisibleCount(PAGE_SIZE);
    setIsLoading(false);
  };

  const toggleSearch = () => {
    setSearchOpen((open) => {
      if (open) setQuery("");
      return !open;
    });
    setVisibleCount(PAGE_SIZE);
    setIsLoading(false);
  };

  const updateQuery = (value: string) => {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
    setIsLoading(false);
  };

  return (
    <div>
      <div className="flex flex-col gap-6 border-b border-ink-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[0.6875rem] font-semibold tracking-[0.15em] text-ember-700 uppercase">
            Learner voices
          </p>
          <h2 className="text-headline mt-3 max-w-2xl text-navy-950">
            Different starting points. Real progress.
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-ink-600">
            Browse reflections on training, practical work, interview preparation,
            and the support learners found most useful.
          </p>
        </div>
        <p
          className="shrink-0 font-mono text-xs text-ink-500"
          aria-live="polite"
        >
          Showing {visible.length} of {filtered.length}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter stories by career path"
        >
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => selectFilter(item.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                filter === item.value
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-ink-300 bg-[#fffdf8] text-navy-900 hover:border-navy-500 hover:bg-navy-50",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-expanded={searchOpen}
          aria-controls="placement-story-search"
          onClick={toggleSearch}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2 self-start rounded-full border px-4 text-sm font-semibold transition-colors sm:self-auto",
            searchOpen
              ? "border-ember-600 bg-ember-50 text-ember-800"
              : "border-ink-300 bg-[#fffdf8] text-navy-900 hover:border-navy-500 hover:bg-navy-50",
          )}
        >
          {searchOpen ? <CloseIcon /> : <SearchIcon />}
          {searchOpen ? "Close search" : "Search stories"}
        </button>
      </div>

      {searchOpen ? (
        <div
          id="placement-story-search"
          role="search"
          className="mt-4 rounded-[1.25rem] border border-white/90 bg-[#fffdf8]/90 p-2 shadow-[0_8px_24px_-18px_rgb(23_63_53/0.35)] ring-1 ring-navy-900/[0.06] backdrop-blur-xl"
        >
          <label htmlFor="story-search-input" className="sr-only">
            Search learner stories
          </label>
          <div className="flex items-center gap-2">
            <span className="ml-2 text-ink-500" aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              ref={searchInputRef}
              id="story-search-input"
              type="search"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Search by name, role, location or story"
              className="h-10 min-w-0 flex-1 bg-transparent px-1 text-sm text-navy-950 outline-none placeholder:text-ink-400"
            />
            {query ? (
              <button
                type="button"
                onClick={() => updateQuery("")}
                className="rounded-full px-3 py-2 text-xs font-semibold text-ember-700 hover:bg-ember-50"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {visible.length ? (
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((story, index) => (
            <Reveal
              key={story.slug}
              delay={(index % 3) * 60}
              scale={0.985}
              threshold={0.05}
              className="h-full"
            >
              <PlacementCard placement={story} className="h-full" />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mt-9 rounded-[1.5rem] border border-ink-200 bg-[#fffdf8] px-6 py-12 text-center">
          <p className="text-base font-semibold text-navy-950">
            No stories match that search.
          </p>
          <p className="mt-2 text-sm text-ink-500">
            Try another name, role, location or keyword.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("all");
              setVisibleCount(PAGE_SIZE);
              setIsLoading(false);
            }}
            className="mt-5 text-sm font-semibold text-ember-700 underline decoration-ember-300 decoration-2 underline-offset-4"
          >
            Clear search and filters
          </button>
        </div>
      )}

      {remaining > 0 ? (
        <div
          ref={loadSentinelRef}
          className="mt-9 min-h-12"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <div
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                aria-hidden="true"
              >
                {Array.from({ length: Math.min(PAGE_SIZE, remaining) }).map(
                  (_, index) => (
                    <StorySkeleton key={index} />
                  ),
                )}
              </div>
              <p className="sr-only" role="status" aria-live="polite">
                Loading more learner stories
              </p>
            </>
          ) : (
            <p className="sr-only">More stories load as you scroll.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function StorySkeleton() {
  return (
    <div className="animate-pulse rounded-[1.75rem] border border-white/90 bg-[#fffdf8]/75 p-5 ring-1 ring-navy-900/[0.05] sm:p-6">
      <div className="flex items-center gap-3.5">
        <div className="size-11 rounded-[0.9rem] bg-navy-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-2/5 rounded-full bg-ink-200" />
          <div className="h-2.5 w-3/5 rounded-full bg-ink-100" />
        </div>
      </div>
      <div className="mt-5 space-y-3 border-t border-ink-200/80 pt-5">
        <div className="h-2.5 w-full rounded-full bg-ink-100" />
        <div className="h-2.5 w-[92%] rounded-full bg-ink-100" />
        <div className="h-2.5 w-[78%] rounded-full bg-ink-100" />
        <div className="h-2.5 w-[86%] rounded-full bg-ink-100" />
      </div>
      <div className="mt-6 h-7 w-28 rounded-full bg-navy-50" />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="m12.5 12.5 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
      <path d="m5.5 5.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
