"use client";

import { useEffect, useState } from "react";
import { useAppState, isPaid, type Tier } from "@/lib/state";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { usePathname } from "next/navigation";
import { routeMeta } from "./Sidebar";

export function TopBar() {
  const {
    tier,
    setTier,
    setNavOpen,
    setSearchOpen,
    operatorName,
  } = useAppState();
  const { title, tagline } = routeMeta(usePathname());
  const toast = useToast();
  const paid = isPaid(tier);
  const [isMac, setIsMac] = useState(false);

  const flipTier = (next: Tier) => {
    if (next === tier) return;
    setTier(next);
    toast.push({
      tone: next === "vip" ? "success" : "info",
      title: next === "vip" ? "VIP+ Trader" : "Free Tier",
      description:
        next === "vip"
          ? "All features unlocked."
          : "Returning to free tier.",
      duration: 2000,
    });
  };

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-lg">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        {/* Left: menu (mobile) + page title */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="-ml-2 rounded-full p-2 text-white/55 transition-colors hover:bg-panel hover:text-white lg:hidden focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4.5h14M2 9h14M2 13.5h14" strokeLinecap="round" />
            </svg>
          </button>
          <div className="min-w-0">
            <div className="truncate font-num text-[24px] font-semibold leading-[26px] tracking-[-0.01em] text-white">{title}</div>
            <p className="hidden truncate text-[13px] leading-[18px] text-white/55 sm:block">{tagline}</p>
          </div>
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="group flex h-9 items-center gap-2 rounded-full bg-white/[0.08] pl-3 pr-2 text-white/55 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none md:w-[260px]"
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <circle cx="9" cy="9" r="6" />
              <path d="M14 14l4 4" strokeLinecap="round" />
            </svg>
            <span className="hidden flex-1 text-left text-[14px] md:inline">Search pairs, news, plans</span>
            <kbd className="hidden rounded-full bg-white/[0.08] px-2 py-0.5 font-sans text-[11px] text-white/40 lg:inline">
              {isMac ? "⌘K" : "Ctrl K"}
            </kbd>
          </button>

          <NotificationBell />

          <button
            onClick={() => window.dispatchEvent(new CustomEvent("ants:help-toggle"))}
            aria-label="Keyboard shortcuts"
            title="Press ? for shortcuts"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold text-white/55 transition-colors hover:bg-panel hover:text-white sm:flex focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ?
          </button>

          {!paid && (
            <Link
              href="/app/subscription"
              className="hidden h-9 items-center rounded-full bg-brand px-4 text-[13px] font-semibold text-black transition-colors hover:bg-brand-dim sm:flex focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Upgrade
            </Link>
          )}

          <Link
            href="/app/settings"
            aria-label={`Account: ${operatorName}`}
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 font-num text-sm font-bold text-brand transition-colors hover:bg-brand/25 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            {operatorName.charAt(0).toUpperCase()}
          </Link>
        </div>
      </div>
    </header>
  );
}
