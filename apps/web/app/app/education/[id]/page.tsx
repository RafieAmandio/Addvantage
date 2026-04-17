"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { primers } from "@/features/education/mock";
import { useAppState, isPaid } from "@/lib/state";
import { useReadPrimers } from "@/features/education/hooks/useReadPrimers";
import { useToast } from "@/lib/toast";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PaywallOverlay } from "@/components/ui/Paywall";

export default function PrimerPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const primer = primers.find((p) => p.id === id);
  const { tier } = useAppState();
  const paid = isPaid(tier);
  const { ids: readIds, hydrated, markRead, markUnread, restore } =
    useReadPrimers();
  const toast = useToast();

  if (!primer) return notFound();
  const locked = primer.locked && !paid;
  const isRead = readIds.includes(primer.id);
  const idx = primers.findIndex((p) => p.id === id);
  const prev = idx > 0 ? primers[idx - 1] : null;
  const next = idx < primers.length - 1 ? primers[idx + 1] : null;

  return (
    <div>
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-4xl px-6 py-10">
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
              <h1 className="mt-2 font-display text-5xl leading-tight text-paper">
                {primer.title}
              </h1>
              <div className="mt-2 font-mono text-xs italic text-lime">
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
                  "border px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 transition-colors " +
                  (isRead
                    ? "border-moss bg-moss/10 text-moss hover:border-blood hover:bg-blood/10 hover:text-blood"
                    : "border-lime/60 text-lime hover:bg-lime hover:text-ink")
                }
              >
                {isRead ? "✓ READ · MARK UNREAD" : "MARK AS READ →"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-10">
        {locked && (
          <PaywallOverlay
            surface={primer.title}
            reason="This primer is part of the operator-tier curriculum. Upgrade to read it."
          />
        )}
        <div className={locked ? "pointer-events-none select-none blur-sm" : ""}>
          <p className="border-l-4 border-lime bg-ink-2/40 p-6 font-display text-2xl italic leading-relaxed text-paper/90">
            {primer.summary}
          </p>

          <SectionNumber n="—" label="PRIMER" className="mt-12" />
          <article className="mt-6 space-y-6">
            {primer.body.map((para, i) => (
              <p
                key={i}
                className="text-base leading-relaxed text-paper/85"
              >
                <span className="mr-3 font-mono text-[10px] uppercase tracking-widest2 text-lime">
                  ¶ {String(i + 1).padStart(2, "0")}
                </span>
                {para}
              </p>
            ))}
          </article>

          <div className="mt-12 border-t border-ink-3 pt-6">
            <DataLabel>Tagged into</DataLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {primer.tags.map((t) => (
                <Link
                  key={t}
                  href={`/app/tags/${t}`}
                  className="border border-lime/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest2 text-lime hover:bg-lime hover:text-ink"
                >
                  #{t}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <nav className="mt-16 grid grid-cols-2 gap-px border border-ink-3 bg-ink-3">
          <Link
            href={prev ? `/app/education/${prev.id}` : "/app/education"}
            className={
              "block bg-ink p-4 transition-colors hover:bg-ink-2 " +
              (prev ? "" : "pointer-events-none opacity-30")
            }
          >
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              ← Previous
            </div>
            <div className="mt-1 line-clamp-1 text-sm text-paper">
              {prev?.title ?? "Library"}
            </div>
          </Link>
          <Link
            href={next ? `/app/education/${next.id}` : "/app/education"}
            className={
              "block bg-ink p-4 text-right transition-colors hover:bg-ink-2 " +
              (next ? "" : "pointer-events-none opacity-30")
            }
          >
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
              Next →
            </div>
            <div className="mt-1 line-clamp-1 text-sm text-paper">
              {next?.title ?? "Library"}
            </div>
          </Link>
        </nav>
      </div>
    </div>
  );
}
