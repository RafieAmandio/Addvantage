"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUrlSyncedState } from "@/lib/hooks/useUrlSyncedState";
import { useAppState, isPaid } from "@/lib/state";
import { useReadPrimers } from "@/features/education/hooks/useReadPrimers";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { BackToTop } from "@/components/ui/BackToTop";
import { PrimerCard } from "@/features/education/components/PrimerCard";
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
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest2 text-brand">
            <span className="led" />
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

  const accessible = primers.filter((p) => !(p.locked && !paid));
  const readCount = accessible.filter((p) => readIds.includes(p.id)).length;
  const pct = accessible.length
    ? Math.round((readCount / accessible.length) * 100)
    : 0;

  const visiblePrimers = useMemo(
    () => primers.filter((p) => primerMatchesQuery(p, query)),
    [query, primers]
  );

  const indexById = useMemo(() => {
    const m = new Map<string, number>();
    primers.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [primers]);

  return (
    <div className="stagger">
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
      <div className="border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <DataLabel>Transmission TX-05</DataLabel>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl text-white">
            Education <span className="italic text-brand">Library</span>
          </h1>
          <p className="mt-2 max-w-2xl font-display text-lg text-white/60">
            Process. Psychology. Risk. System design. No price-action snake
            oil. Each primer is anchored to a real framework and tagged into
            the hashtag system.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
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
                <div className="flex items-baseline justify-between font-mono text-[9px] uppercase tracking-widest2 text-white/50">
                  <span>Progress</span>
                  <span className="text-brand">
                    {readCount} / {accessible.length} · {pct}%
                  </span>
                </div>
                <div className="mt-1 h-1 w-full bg-gray-3">
                  <div
                    className="h-full bg-brand transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {readCount > 0 && (
                <button
                  onClick={() => setConfirmingReset(true)}
                  className="border border-gray-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-white/50 hover:border-blood hover:text-blood-bright"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        {primers.length === 0 && (
          <div className="mt-6 border border-gray-3 bg-gray-2/40 p-12 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              ● LIBRARY EMPTY
            </div>
            <div className="mt-3 font-display text-2xl text-white">
              No primers published yet.
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              The desk is preparing the library. Check back soon.
            </p>
          </div>
        )}

        {visiblePrimers.length === 0 && query && primers.length > 0 && (
          <div className="mt-6 border border-gray-3 bg-gray-2/40 p-12 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
              ● NULL TRANSMISSION
            </div>
            <div className="mt-3 font-display text-2xl text-white">
              No primers match &ldquo;{query}&rdquo;.
            </div>
            <button
              onClick={() => setQuery("")}
              className="mt-6 border border-brand/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black"
            >
              ✕ Clear search
            </button>
          </div>
        )}

        <div className="mt-6 grid grid-cols-12 gap-px bg-gray-3">
          {visiblePrimers.map((p) => {
            const i = indexById.get(p.id) ?? 0;
            const indexLabel =
              String(i + 1).padStart(2, "0") +
              "/" +
              String(primers.length).padStart(2, "0");
            return (
              <PrimerCard
                key={p.id}
                primer={p}
                query={query}
                locked={p.locked && !paid}
                read={readIds.includes(p.id)}
                indexLabel={indexLabel}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
