"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUrlSyncedState } from "@/lib/hooks/useUrlSyncedState";
import { useAppState, isPaid } from "@/lib/state";
import { useReadPrimers } from "@/features/education/hooks/useReadPrimers";
import { Panel } from "@/components/ui/Panel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { BackToTop } from "@/components/ui/BackToTop";
import { PrimerCard } from "@/features/education/components/PrimerCard";
import { EducationTabs } from "@/features/videos/components/EducationTabs";
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
          <div className="flex items-center gap-3 text-[14px] text-white/55">
            <span className="led" aria-hidden />
            Loading library...
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
      <div className="space-y-4 px-4 pb-10 sm:px-6">
        <EducationTabs current="primers" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <PageSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search titles, frameworks, body text, tags   (s)"
              ariaLabel="Search primers"
              matchLabel={
                query
                  ? `${visiblePrimers.length} ${visiblePrimers.length === 1 ? "match" : "matches"} for "${query}"`
                  : null
              }
            />

            <Panel
              title={query ? `${visiblePrimers.length} of ${primers.length} primers` : `${primers.length} primers`}
              sub="Process, psychology, risk and system design. Each primer is anchored to a real framework."
            >
              {primers.length === 0 ? (
                <p className="py-10 text-center text-[14px] text-white/40">
                  No primers published yet. The desk is preparing the library.
                </p>
              ) : visiblePrimers.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-[14px] text-white/40">No primers match &ldquo;{query}&rdquo;.</p>
                  <button
                    onClick={() => setQuery("")}
                    className="mt-4 rounded-full border border-white/[0.14] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-raised focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="-my-1 divide-y divide-white/[0.07]">
                  {visiblePrimers.map((p) => (
                    <PrimerCard
                      key={p.id}
                      primer={p}
                      query={query}
                      locked={p.locked && !paid}
                      read={readIds.includes(p.id)}
                    />
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
            <Panel
              title="Your progress"
              sub="Read on this device"
              action={
                hydrated && readCount > 0 ? (
                  <button
                    onClick={() => setConfirmingReset(true)}
                    className="text-[13px] font-medium text-white/30 hover:text-down focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    Reset
                  </button>
                ) : null
              }
            >
              <p className="font-num text-[40px] font-semibold leading-[44px] text-white">
                {hydrated ? readCount : 0}
                <span className="text-white/30"> / {accessible.length}</span>
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full bg-brand" style={{ width: `${hydrated ? pct : 0}%` }} />
              </div>
              {accessible.length < primers.length && (
                <p className="mt-3 text-[13px] text-white/40">
                  {primers.length - accessible.length} more with VIP+
                </p>
              )}
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
}
