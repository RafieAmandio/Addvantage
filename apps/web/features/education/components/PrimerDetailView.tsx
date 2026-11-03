"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { useAppState, isPaid } from "@/lib/state";
import { useReadPrimers } from "@/features/education/hooks/useReadPrimers";
import { useToast } from "@/lib/toast";
import { Panel } from "@/components/ui/Panel";
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

  const toggleRead = (
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
              label: "Undo",
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
              label: "Undo",
              onClick: () => restore(snapshot),
            },
          });
        }
      }}
      className={cn(
        "flex h-11 w-full items-center justify-center rounded-full text-[14px] font-semibold transition-colors focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
        isRead
          ? "border border-white/[0.14] text-up hover:bg-raised hover:text-white"
          : "bg-brand text-black hover:opacity-90"
      )}
    >
      {isRead ? "✓ Read, mark unread" : "Mark as read"}
    </button>
  );

  return (
    <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <article className="relative min-w-0 overflow-hidden rounded-2xl bg-panel p-5 sm:p-8">
        <Link href="/app/education/primers" className="text-[13px] text-white/40 hover:text-white">
          ← Primers
        </Link>
        <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
          {primer.id}
          <span className="px-1.5 text-white/20">/</span>
          {primer.readingMin} min read
          <span className="px-1.5 text-white/20">/</span>
          {primer.author}
        </p>
        <h1 className="mt-2 text-balance font-num text-[34px] font-semibold leading-[38px] text-white sm:text-[44px] sm:leading-[46px]">
          {primer.title}
        </h1>
        <p className="mt-2 text-[14px] font-medium text-brand">{primer.framework}</p>

        <div className={cn("relative mt-6", locked && "min-h-[360px]")}>
          {locked && (
            <div className="absolute inset-0 z-10">
              <PaywallOverlay
                surface={primer.title}
                reason="This primer is part of the operator-tier curriculum. Upgrade to read it."
              />
            </div>
          )}
          <div className={cn("max-w-[68ch]", locked && "pointer-events-none select-none blur-sm")}>
            <p className="text-[19px] font-medium leading-[29px] text-white">{primer.summary}</p>
            <div className="mt-6 space-y-4">
              {primer.body.map((para, i) => (
                <p key={i} className="text-[17px] leading-[28px] text-white/85">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      </article>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
        {hydrated && !locked && <Panel>{toggleRead}</Panel>}

        {primer.tags.length > 0 && (
          <Panel title="Tagged into">
            <div className="flex flex-wrap gap-1.5">
              {primer.tags.map((t) => (
                <Link
                  key={t}
                  href={`/app/tags/${t}`}
                  className="rounded-full border border-white/[0.12] px-2.5 py-0.5 text-[12px] text-white/60 transition-colors hover:bg-raised hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                >
                  #{t}
                </Link>
              ))}
            </div>
          </Panel>
        )}

        <nav className="grid grid-cols-2 gap-4 lg:grid-cols-1" aria-label="Previous and next primers">
          {[
            { to: prev, label: "← Previous", right: false },
            { to: next, label: "Next →", right: true },
          ].map((x) => (
            <Link
              key={x.label}
              href={x.to ? `/app/education/${x.to.id}` : "/app/education/primers"}
              className={cn(
                "block min-w-0 rounded-2xl bg-panel px-5 py-4 transition-colors hover:bg-raised focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
                x.right && "text-right lg:text-left",
                !x.to && "pointer-events-none opacity-30"
              )}
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{x.label}</p>
              <p className="mt-1 line-clamp-1 text-[14px] text-white">{x.to?.title ?? "Library"}</p>
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}
