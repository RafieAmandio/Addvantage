"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUrlSyncedState } from "@/lib/hooks/useUrlSyncedState";
import { useAppState, isPaid } from "@/lib/state";
import { useReadPrimers } from "@/features/education/hooks/useReadPrimers";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Highlight } from "@/components/ui/Highlight";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { BackToTop } from "@/components/ui/BackToTop";
import type { Primer } from "@/features/education/types";

function primerMatchesQuery(p: Primer, q: string): boolean {
  if (!q) return true;
  const haystack = [
    p.id,
    p.title,
    p.framework,
    p.summary,
    p.author,
    ...p.body,
    ...p.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

export function EducationLibraryView({ primers }: { primers: Primer[] }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-lime">
            <span className="led lime" />
            DECODING LIBRARY
          </div>
        </div>
      }
    >
      <EducationViewInner primers={primers} />
    </Suspense>
  );
}

function EducationViewInner({ primers }: { primers: Primer[] }) {
  const { tier } = useAppState();
  const paid = isPaid(tier);
  const { ids: readIds, hydrated, reset } = useReadPrimers();
  const searchParams = useSearchParams();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [query, setQuery] = useState<string>(
    () => searchParams.get("q")?.trim() ?? ""
  );

  useUrlSyncedState({ q: query || null });

  // Only count primers the user can actually access
  const accessible = primers.filter((p) => !(p.locked && !paid));
  const readCount = accessible.filter((p) => readIds.includes(p.id)).length;
  const pct = accessible.length
    ? Math.round((readCount / accessible.length) * 100)
    : 0;

  const visiblePrimers = useMemo(
    () => primers.filter((p) => primerMatchesQuery(p, query)),
    [query, primers]
  );

  return (
    <div>
      <BackToTop />
      <ConfirmDialog
        open={confirmingReset}
        title="Clear reading progress?"
        description={`All ${readCount} read primers will be marked unread. This cannot be undone.`}
        confirmLabel="Clear progress"
        cancelLabel="Keep"
        destructive
        onConfirm={() => {
          reset();
          setConfirmingReset(false);
        }}
        onCancel={() => setConfirmingReset(false)}
      />
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <DataLabel>Transmission TX-05</DataLabel>
          <h1 className="mt-2 font-display text-5xl text-paper">
            Education <span className="italic text-lime">Library</span>
          </h1>
          <p className="mt-2 max-w-2xl font-display text-lg text-paper/60">
            Process. Psychology. Risk. System design. No price-action snake
            oil. Each primer is anchored to a real framework and tagged into
            the hashtag system.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Search input */}
        <div className="mb-6">
          <PageSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search titles, frameworks, body text, tags…   (press s to focus, esc to blur)"
            ariaLabel="Search primers"
            matchLabel={
              query
                ? `${visiblePrimers.length} ${visiblePrimers.length === 1 ? "MATCH" : "MATCHES"} for "${query}"`
                : null
            }
          />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionNumber
            n="—"
            label={
              query
                ? `${visiblePrimers.length} / ${primers.length} PRIMERS`
                : `${primers.length} PRIMERS`
            }
          />
          {hydrated && accessible.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="min-w-[160px]">
                <div className="flex items-baseline justify-between font-mono text-[9px] uppercase tracking-widest2 text-paper/50">
                  <span>Progress</span>
                  <span className="text-lime">
                    {readCount} / {accessible.length} · {pct}%
                  </span>
                </div>
                <div className="mt-1 h-1 w-full bg-ink-3">
                  <div
                    className="h-full bg-lime transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {readCount > 0 && (
                <button
                  onClick={() => setConfirmingReset(true)}
                  className="border border-ink-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/50 hover:border-blood hover:text-blood"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        {visiblePrimers.length === 0 && query && (
          <div className="mt-6 border border-ink-3 bg-ink-2/40 p-12 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood">
              ● NULL TRANSMISSION
            </div>
            <div className="mt-3 font-display text-2xl text-paper">
              No primers match "{query}".
            </div>
            <button
              onClick={() => setQuery("")}
              className="mt-6 border border-lime/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
            >
              ✕ Clear search
            </button>
          </div>
        )}

        <div className="mt-6 grid grid-cols-12 gap-px bg-ink-3">
          {visiblePrimers.map((p) => {
            const i = primers.findIndex((x) => x.id === p.id);
            const locked = p.locked && !paid;
            const read = readIds.includes(p.id);
            return (
              <Link
                key={p.id}
                href={`/app/education/${p.id}`}
                className="group relative col-span-12 bg-ink p-8 transition-colors hover:bg-ink-2 sm:col-span-6 lg:col-span-4"
              >
                {read && !locked && (
                  <div className="absolute right-0 top-0 bg-moss/15 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-moss">
                    ✓ READ
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
                    <Highlight text={p.id} query={query} />
                  </div>
                  <div
                    className={
                      "font-mono text-[9px] uppercase tracking-widest2 " +
                      (locked ? "text-blood" : "text-moss")
                    }
                  >
                    ● {locked ? "LOCKED" : "OPEN"}
                  </div>
                </div>
                <h3
                  className={
                    "mt-6 font-display text-3xl leading-tight transition-colors " +
                    (read && !locked ? "text-paper/60" : "text-paper")
                  }
                >
                  <Highlight text={p.title} query={query} />
                </h3>
                <div className="mt-1 font-mono text-[10px] italic uppercase tracking-widest2 text-lime/70">
                  <Highlight text={p.framework} query={query} />
                </div>
                <p className="mt-4 text-sm text-paper/70">
                  <Highlight text={p.summary} query={query} />
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-ink-3 pt-3">
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[9px] uppercase tracking-widest2 text-lime/60"
                      >
                        #<Highlight text={t} query={query} />
                      </span>
                    ))}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-widest2 text-paper/40">
                    {p.readingMin} min · {String(i + 1).padStart(2, "0")}/
                    {String(primers.length).padStart(2, "0")}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
