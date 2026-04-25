"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DataLabel } from "@/components/ui/Marker";
import { useAppState } from "@/lib/state";
import { cn } from "@/lib/cn";
import { OPERATOR_ID } from "@/features/dashboard/types";

/**
 * Top hero band of the operator home page: date stamp, greeting, big search
 * trigger, and the right-side operator card with quick stats + links. Pure
 * presentation — all counts and tier info are passed in; search open state
 * is read from `useAppState` (cross-cutting app shell).
 */
export function DashboardHero({
  stamp,
  greet,
  operatorName,
  paid,
  isMac,
  highImpactToday,
  openSetups,
  highCalendar,
  className,
}: {
  stamp: string;
  greet: string;
  operatorName: string;
  paid: boolean;
  isMac: boolean;
  highImpactToday: number;
  openSetups: number;
  highCalendar: number;
  className?: string;
}) {
  const { setSearchOpen } = useAppState();

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-gray-3 bg-black-2/30",
        className
      )}
    >
      <div className="absolute -right-24 -top-24 h-[24rem] w-[24rem] rounded-full bg-brand/10 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <DataLabel>{stamp || "—"}</DataLabel>
            <h1 className="mt-3 font-display text-5xl leading-[0.95] text-white sm:text-6xl lg:text-7xl">
              <span suppressHydrationWarning>{greet}</span>,
              <br />
              <span className="italic text-brand">{operatorName}</span>.
            </h1>
            <p className="mt-6 max-w-xl font-display text-xl text-white/60">
              The DOMAIN has been transmitting overnight.{" "}
              <span className="text-white">{highImpactToday}</span> high-impact
              items, <span className="text-white">{openSetups}</span> open
              setups on the Trading Plan, and{" "}
              <span className="text-white">{highCalendar}</span> high-impact
              events on the calendar in the next 48h.
            </p>

            {/* Big search bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="group mt-10 flex w-full max-w-xl items-center gap-4 border border-brand/40 bg-black-2/60 px-5 py-4 text-left transition-colors hover:border-brand"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="shrink-0 text-brand"
                aria-hidden
              >
                <circle cx="9" cy="9" r="6" />
                <path d="M14 14l4 4" strokeLinecap="round" />
              </svg>
              <span className="flex-1 truncate font-display text-lg italic text-white/40 group-hover:text-white/60">
                Search news, plans, primers, channels…
              </span>
              <span className="hidden items-center gap-1 sm:flex">
                <kbd className="border border-brand/30 bg-black px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-brand">
                  {isMac ? "⌘" : "Ctrl"}
                </kbd>
                <kbd className="border border-brand/30 bg-black px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-brand">
                  K
                </kbd>
              </span>
            </button>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              <span>Try:</span>
              {["fed", "BBCA", "loss aversion", "drawdown", "USDIDR"].map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => setSearchOpen(true)}
                    className="border-b border-transparent text-white/60 hover:border-brand hover:text-brand"
                  >
                    {s}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Operator card */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="border border-gray-3 bg-black/60 p-5">
              <div className="flex items-baseline justify-between">
                <DataLabel>Operator</DataLabel>
                <span
                  className={cn(
                    "font-mono text-[9px] uppercase tracking-widest2",
                    paid ? "text-moss" : "text-white/40"
                  )}
                >
                  ● {paid ? "TIER 01" : "TIER 00"}
                </span>
              </div>
              <NameField />
              <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                {OPERATOR_ID} · {paid ? "VIP+ Trader" : "Free access"}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-px bg-black-3">
                <Stat label="High news" value={highImpactToday} />
                <Stat label="Setups" value={openSetups} />
                <Stat label="Cal · 48h" value={highCalendar} />
              </div>

              <Link
                href="/app/brief"
                className="mt-5 block border border-brand/60 py-2 text-center font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black"
              >
                Open today&apos;s full brief →
              </Link>
              <Link
                href="/app/subscription"
                className="mt-2 block py-1 text-center font-mono text-[9px] uppercase tracking-widest2 text-white/40 hover:text-brand"
              >
                {paid ? "Manage subscription" : "Upgrade access"}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function NameField() {
  const { operatorName, setOperatorName } = useAppState();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(operatorName);

  useEffect(() => {
    setDraft(operatorName);
  }, [operatorName]);

  const commit = () => {
    const v = draft.trim();
    setOperatorName(v.length > 0 ? v : "Operator");
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(operatorName);
            setEditing(false);
          }
        }}
        className="mt-2 w-full border-b-2 border-brand bg-transparent font-display text-2xl text-brand outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to rename"
      className="group mt-2 block w-full text-left font-display text-2xl text-white transition-colors hover:text-brand"
    >
      {operatorName}
      <span className="ml-2 font-mono text-[9px] uppercase tracking-widest2 text-white/30 opacity-0 transition-opacity group-hover:opacity-100">
        ✎ rename
      </span>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-black p-3 text-center">
      <div className="font-display text-3xl text-brand">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
        {label}
      </div>
    </div>
  );
}
