"use client";

import Link from "next/link";
import { useAppState, isPaid } from "@/lib/state";
import { useReadPrimers } from "@/features/education/hooks/useReadPrimers";
import { useToast } from "@/lib/toast";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PaywallOverlay } from "@/components/ui/Paywall";
import type { Primer } from "@/features/education/types";

type NeighbourRef = { id: string; title: string } | null;

export function PrimerDetailView({
  primer,
  prev,
  next,
}: {
  primer: Primer;
  prev: NeighbourRef;
  next: NeighbourRef;
}) {
  const { tier } = useAppState();
  const paid = isPaid(tier);
  const { ids: readIds, hydrated, markRead, markUnread, restore } =
    useReadPrimers();
  const toast = useToast();

  const locked = primer.locked && !paid;
  const isRead = readIds.includes(primer.id);

  return (
    <div className="stagger">
      <div className="border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/app" },
              { label: "Education", href: "/app/education" },
              { label: primer.id },
            ]}
          />
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <DataLabel>
                {primer.id} · {primer.readingMin} min · by {primer.author}
              </DataLabel>
              <h1 className="mt-2 font-display text-5xl leading-tight text-white">
                {primer.title}
              </h1>
              <div className="mt-2 font-mono text-xs italic text-brand">
                {primer.framework}
              </div>
            </div>

            {hydrated && !locked && (
              <button
                onClick={() => {
                  const snapshot = [...readIds];
                  if (isRead) {
                    markUnread(primer.id);
                    toast.push({
                      tone: "info",
                      title: "Marked unread",
                      description: primer.title,
                      duration: 3500,
                      action: {
                        label: "↶ UNDO",
                        onClick: () => restore(snapshot),
                      },
                    });
                  } else {
                    markRead(primer.id);
                    toast.push({
                      tone: "success",
                      title: "Primer logged",
                      description: `${primer.title} · ${primer.readingMin} min`,
                      duration: 3500,
                      action: {
                        label: "↶ UNDO",
                        onClick: () => restore(snapshot),
                      },
                    });
                  }
                }}
                className={
                  "border px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 transition-colors focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none " +
                  (isRead
                    ? "border-moss bg-moss/10 text-moss hover:border-blood hover:bg-blood/10 hover:text-blood-bright"
                    : "border-brand/60 text-brand hover:bg-brand hover:text-black")
                }
              >
                {isRead ? "✓ READ · MARK UNREAD" : "MARK AS READ →"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {locked && (
          <PaywallOverlay
            surface={primer.title}
            reason="This primer is part of the operator-tier curriculum. Upgrade to read it."
          />
        )}
        <div className={locked ? "pointer-events-none select-none blur-sm" : ""}>
          <p className="border-l-4 border-brand bg-gray-2/40 p-6 font-display text-2xl italic leading-relaxed text-white/90">
            {primer.summary}
          </p>

          <SectionNumber n="—" label="PRIMER" className="mt-12" />
          <article className="mt-6 space-y-6">
            {primer.body.map((para, i) => (
              <p
                key={i}
                className="text-base leading-relaxed text-white/85"
              >
                <span className="mr-3 font-mono text-[10px] uppercase tracking-widest2 text-brand">
                  ¶ {String(i + 1).padStart(2, "0")}
                </span>
                {para}
              </p>
            ))}
          </article>

          <div className="mt-12 border-t border-gray-3 pt-6">
            <DataLabel>Tagged into</DataLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {primer.tags.map((t) => (
                <Link
                  key={t}
                  href={`/app/tags/${t}`}
                  className="border border-brand/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                >
                  #{t}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <nav className="mt-16 grid grid-cols-2 gap-px border border-gray-3 bg-gray-3">
          <Link
            href={prev ? `/app/education/${prev.id}` : "/app/education"}
            className={
              "block bg-black p-4 transition-colors hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none " +
              (prev ? "" : "pointer-events-none opacity-30")
            }
          >
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              ← Previous
            </div>
            <div className="mt-1 line-clamp-1 text-sm text-white">
              {prev?.title ?? "Library"}
            </div>
          </Link>
          <Link
            href={next ? `/app/education/${next.id}` : "/app/education"}
            className={
              "block bg-black p-4 text-right transition-colors hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none " +
              (next ? "" : "pointer-events-none opacity-30")
            }
          >
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              Next →
            </div>
            <div className="mt-1 line-clamp-1 text-sm text-white">
              {next?.title ?? "Library"}
            </div>
          </Link>
        </nav>
      </div>
    </div>
  );
}
