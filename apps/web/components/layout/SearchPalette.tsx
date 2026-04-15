"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/state";
import {
  search,
  groupResults,
  KIND_META,
  type SearchResult,
  type ResultKind,
} from "@/lib/search";
import { getRecentVisits, type RecentVisit } from "@/lib/visits";
import { Highlight } from "@/components/ui/Highlight";
import { cn } from "@/lib/cn";

const RECENT_KEY = "ants-domain-recent-searches";
const MAX_RECENT = 6;

const SUGGESTIONS = [
  "fed",
  "btc",
  "BBCA",
  "loss aversion",
  "drawdown",
  "USDIDR",
  "developing-edge",
];

export function SearchPalette() {
  const { searchOpen, setSearchOpen } = useAppState();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [visits, setVisits] = useState<RecentVisit[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Hydrate recents
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  // Refresh visit list whenever the palette opens
  useEffect(() => {
    if (searchOpen) setVisits(getRecentVisits());
  }, [searchOpen]);

  // Reset on open
  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setActive(0);
      // Defer focus until after the modal mounts
      requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [searchOpen]);

  const results = useMemo(() => search(query, 30), [query]);
  const grouped = useMemo(() => groupResults(results), [results]);
  const flat = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  // Clamp active when results change
  useEffect(() => {
    if (active >= flat.length) setActive(0);
  }, [flat.length, active]);

  // Scroll active into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-result-index="${active}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const commit = (r: SearchResult) => {
    // Add to recents
    const next = [query.trim(), ...recent.filter((q) => q !== query.trim())]
      .filter(Boolean)
      .slice(0, MAX_RECENT);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
    setSearchOpen(false);
    router.push(r.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flat[active];
      if (target) commit(target);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSearchOpen(false);
    }
  };

  if (!searchOpen) return null;

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh] sm:pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search the DOMAIN"
    >
      {/* Backdrop */}
      <div
        onClick={() => setSearchOpen(false)}
        className="absolute inset-0 bg-ink/85 backdrop-blur-md"
      />

      {/* Palette */}
      <div className="relative w-full max-w-3xl border border-amber bg-ink-2 shadow-[0_0_80px_rgba(245,158,11,0.18)]">
        {/* Classification stripe */}
        <div className="classification-stripe h-1" />

        {/* Header / input */}
        <div className="border-b border-ink-3 bg-ink-2/80">
          <div className="flex items-center gap-3 px-5 py-4">
            <SearchIcon />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search news, plans, primers, channels, hashtags…"
              className="flex-1 bg-transparent font-display text-2xl text-paper placeholder:text-paper/30 outline-none"
            />
            <button
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="border border-ink-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-paper/50 hover:border-amber hover:text-amber"
            >
              esc
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-ink-3 px-5 py-2 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
            <span>
              {query
                ? `${results.length} ${results.length === 1 ? "result" : "results"} across ${grouped.length} ${grouped.length === 1 ? "channel" : "channels"}`
                : "● TRANSMISSION SEARCH · OPERATOR EYES ONLY"}
            </span>
            <span className="hidden sm:flex items-center gap-3">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>esc close</span>
            </span>
          </div>
        </div>

        {/* Body */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
          {!query && (
            <EmptyState
              recent={recent}
              visits={visits}
              onPick={(q) => {
                setQuery(q);
                setActive(0);
                inputRef.current?.focus();
              }}
              onJump={(href) => {
                setSearchOpen(false);
                router.push(href);
              }}
            />
          )}

          {query && results.length === 0 && (
            <div className="p-10 text-center">
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood">
                ● NULL TRANSMISSION
              </div>
              <div className="mt-3 font-display text-2xl text-paper">
                Nothing matches "{query}".
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                The desk doesn't fabricate results to fill a screen.
              </div>

              <div className="mx-auto mt-8 max-w-md border-t border-ink-3 pt-6">
                <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                  ● Try one of these instead
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setQuery(s);
                        setActive(0);
                        inputRef.current?.focus();
                      }}
                      className="border border-amber/30 bg-amber/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-amber hover:bg-amber hover:text-ink"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {recent.length > 0 && (
                  <>
                    <div className="mt-6 font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                      ● Or your recent searches
                    </div>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {recent.map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setQuery(q);
                            setActive(0);
                            inputRef.current?.focus();
                          }}
                          className="border border-ink-3 bg-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-paper/70 hover:border-amber hover:text-amber"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {query &&
            grouped.map(([kind, items]) => (
              <div key={kind} className="border-b border-ink-3 last:border-b-0">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-3 bg-ink-2/95 px-5 py-2 backdrop-blur">
                  <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-amber">
                    <span>{KIND_META[kind].code}</span>
                    <span className="h-px w-6 bg-amber/40" />
                    <span>{KIND_META[kind].label}</span>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                    {items.length}
                  </span>
                </div>
                {items.map((r) => {
                  runningIndex += 1;
                  const idx = runningIndex;
                  return (
                    <ResultRow
                      key={`${r.kind}-${r.id}`}
                      result={r}
                      kind={kind}
                      index={idx}
                      active={idx === active}
                      query={query}
                      onHover={() => setActive(idx)}
                      onClick={() => commit(r)}
                    />
                  );
                })}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  recent,
  visits,
  onPick,
  onJump,
}: {
  recent: string[];
  visits: RecentVisit[];
  onPick: (q: string) => void;
  onJump: (href: string) => void;
}) {
  return (
    <div className="p-6">
      {visits.length > 0 && (
        <section className="mb-6">
          <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
            ● Where you were
          </div>
          <div className="mt-3 grid grid-cols-1 gap-px bg-ink-3 sm:grid-cols-2">
            {visits.map((v) => (
              <button
                key={v.href}
                onClick={() => onJump(v.href)}
                className="group flex items-center justify-between bg-ink p-3 text-left transition-colors hover:bg-ink-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[9px] uppercase tracking-widest2 text-amber">
                    {v.kind}
                  </div>
                  <div className="mt-0.5 truncate text-sm text-paper transition-colors group-hover:text-amber">
                    {v.label}
                  </div>
                </div>
                <span className="ml-3 shrink-0 font-mono text-[9px] uppercase tracking-widest2 text-paper/30 group-hover:text-amber">
                  →
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mb-6">
          <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
            ● Recent transmissions
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recent.map((q) => (
              <button
                key={q}
                onClick={() => onPick(q)}
                className="border border-ink-3 bg-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-paper/70 hover:border-amber hover:text-amber"
              >
                {q}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
          ● Try
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onPick(q)}
              className="border border-amber/30 bg-amber/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-amber hover:bg-amber hover:text-ink"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-px bg-ink-3 sm:grid-cols-2">
        <Tip
          chord="Cmd K"
          alt="Ctrl K"
          label="Open this palette from anywhere"
        />
        <Tip chord="/" label="Same — single key" />
        <Tip chord="↑ ↓" label="Move between results" />
        <Tip chord="↵" label="Open the highlighted result" />
        <Tip chord="esc" label="Close" />
        <Tip chord="?" label="See all keyboard shortcuts" />
      </div>
    </div>
  );
}

function Tip({
  chord,
  alt,
  label,
}: {
  chord: string;
  alt?: string;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between bg-ink p-3">
      <span className="font-mono text-[10px] uppercase tracking-widest2 text-paper/60">
        {label}
      </span>
      <span className="flex items-center gap-1">
        {alt && (
          <>
            <kbd className="border border-amber/30 bg-ink-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/60">
              {alt}
            </kbd>
            <span className="text-paper/30">/</span>
          </>
        )}
        {chord.split(" ").map((k, i) => (
          <kbd
            key={i}
            className="border border-amber/40 bg-ink-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-amber"
          >
            {k}
          </kbd>
        ))}
      </span>
    </div>
  );
}

function ResultRow({
  result,
  kind,
  index,
  active,
  query,
  onHover,
  onClick,
}: {
  result: SearchResult;
  kind: ResultKind;
  index: number;
  active: boolean;
  query: string;
  onHover: () => void;
  onClick: () => void;
}) {
  return (
    <button
      data-result-index={index}
      onMouseEnter={onHover}
      onClick={onClick}
      className={cn(
        "block w-full border-b border-ink-3 px-5 py-4 text-left transition-colors",
        active
          ? "border-l-2 border-l-amber bg-amber/10"
          : "border-l-2 border-l-transparent bg-ink hover:bg-ink-2"
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest2 text-amber">
              {result.id}
            </span>
            {result.author && (
              <span className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                · BY {result.author.toUpperCase()}
              </span>
            )}
          </div>
          <div className="mt-1 truncate font-display text-lg text-paper">
            <Highlight text={result.title} query={query} />
          </div>
          <div className="mt-1 line-clamp-2 text-sm text-paper/60">
            <Highlight text={result.snippet} query={query} />
          </div>
          {result.tags && result.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="font-mono text-[9px] uppercase tracking-widest2 text-amber/60"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="hidden shrink-0 text-right font-mono text-[9px] uppercase tracking-widest2 text-paper/40 sm:block">
          <div>{KIND_META[kind].label}</div>
          {result.meta && <div className="mt-1">{result.meta}</div>}
        </div>
      </div>
    </button>
  );
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-amber"
      aria-hidden
    >
      <circle cx="9" cy="9" r="6" />
      <path d="M14 14l4 4" strokeLinecap="round" />
    </svg>
  );
}
