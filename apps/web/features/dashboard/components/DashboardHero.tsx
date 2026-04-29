"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppState } from "@/lib/state";
import { cn } from "@/lib/cn";

export function DashboardHero({
  stamp,
  greet,
  operatorName,
  paid,
  isMac,
  highImpactToday,
  openSetups,
  className,
}: {
  stamp: string;
  greet: string;
  operatorName: string;
  paid: boolean;
  isMac: boolean;
  highImpactToday: number;
  openSetups: number;
  className?: string;
}) {
  const { setSearchOpen } = useAppState();

  return (
    <section className={cn("relative overflow-hidden border-b border-white/[0.06]", className)}>
      <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand/[0.07] blur-[140px]" />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid grid-cols-12 gap-6">
          {/* Main content */}
          <div className="col-span-12 lg:col-span-8">
            <p className="text-sm text-white/40" suppressHydrationWarning>
              {stamp || " "}
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              <span suppressHydrationWarning>{greet}</span>,
              <br />
              <span className="text-brand">{operatorName}</span>.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/50 sm:mt-5 sm:text-lg">
              {highImpactToday > 0 ? (
                <>
                  <span className="text-white">{highImpactToday}</span> high-impact
                  {highImpactToday === 1 ? " item" : " items"} and{" "}
                  <span className="text-white">{openSetups}</span> open
                  {openSetups === 1 ? " setup" : " setups"} on the Trading Plan.
                </>
              ) : (
                "No high-impact items today. Markets are quiet."
              )}
            </p>

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="group mt-8 flex w-full max-w-xl items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-left transition-all hover:border-white/[0.15] hover:bg-white/[0.05] focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-white/30" aria-hidden>
                <circle cx="9" cy="9" r="6" />
                <path d="M14 14l4 4" strokeLinecap="round" />
              </svg>
              <span className="flex-1 truncate text-sm text-white/30 group-hover:text-white/40">
                Search news, plans, primers, channels...
              </span>
              <span className="hidden items-center gap-1 sm:flex">
                <kbd className="rounded-md bg-white/[0.06] px-2 py-1 text-[10px] text-white/25">
                  {isMac ? "⌘" : "Ctrl"}
                </kbd>
                <kbd className="rounded-md bg-white/[0.06] px-2 py-1 text-[10px] text-white/25">
                  K
                </kbd>
              </span>
            </button>
          </div>

          {/* Stats card */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/40">Overview</span>
                <span className={cn("text-xs", paid ? "text-moss" : "text-white/30")}>
                  {paid ? "VIP+" : "Free"}
                </span>
              </div>
              <NameField />

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Stat label="High impact" value={highImpactToday} />
                <Stat label="Open setups" value={openSetups} />
              </div>

              <Link
                href="/app/brief"
                className="mt-5 block rounded-lg bg-brand py-2.5 text-center text-sm font-bold text-black transition-colors hover:bg-brand-dim focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                Open today&apos;s brief
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
        className="mt-2 w-full rounded-lg border border-brand bg-transparent px-2 py-1 text-xl font-bold text-white outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to rename"
      className="group mt-2 block w-full text-left text-xl font-bold text-white transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
    >
      {operatorName}
      <span className="ml-2 text-xs text-white/20 opacity-0 transition-opacity group-hover:opacity-100">
        edit
      </span>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/[0.04] p-3 text-center">
      <div className="text-2xl font-bold text-brand">{value}</div>
      <div className="mt-0.5 text-[11px] text-white/40">{label}</div>
    </div>
  );
}
