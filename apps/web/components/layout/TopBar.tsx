"use client";

import { useEffect, useState } from "react";
import { useAppState, isPaid, type Tier } from "@/lib/state";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

export function TopBar() {
  const {
    tier,
    setTier,
    setNavOpen,
    setSearchOpen,
    operatorName,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useAppState();
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
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/90 backdrop-blur-lg">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Left */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white lg:hidden focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4.5h14M2 9h14M2 13.5h14" strokeLinecap="round" />
            </svg>
          </button>

          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              aria-label="Expand sidebar"
              title="Expand sidebar · \"
              className="hidden rounded-lg p-2 text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white lg:flex focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 4v8" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {sidebarCollapsed && (
            <Link href="/" className="hidden font-mono text-sm font-bold text-white lg:block">
              +vantage
            </Link>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Tier toggle */}
          <div className="flex items-center gap-0.5 rounded-lg bg-white/[0.04] p-1">
            <button
              onClick={() => flipTier("free")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
                !paid
                  ? "bg-brand text-black"
                  : "text-white/40 hover:text-white"
              )}
            >
              Free
            </button>
            <button
              onClick={() => flipTier("vip")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
                paid
                  ? "bg-brand text-black"
                  : "text-white/40 hover:text-white"
              )}
            >
              VIP+
            </button>
          </div>

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="group flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/60 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <circle cx="9" cy="9" r="6" />
              <path d="M14 14l4 4" strokeLinecap="round" />
            </svg>
            <span className="hidden text-xs sm:inline">Search</span>
            <span className="hidden items-center gap-0.5 lg:flex">
              <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/30">
                {isMac ? "⌘" : "Ctrl"}
              </kbd>
              <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/30">
                K
              </kbd>
            </span>
          </button>

          <NotificationBell />

          {/* Help */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("ants:help-toggle"))}
            aria-label="Keyboard shortcuts"
            title="Press ? for shortcuts"
            className="rounded-lg p-2 text-xs text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ?
          </button>

          {/* Upgrade CTA */}
          {!paid && (
            <Link
              href="/app/subscription"
              className="hidden rounded-lg bg-brand px-3 py-2 text-xs font-bold text-black transition-colors hover:bg-brand-dim sm:block focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Upgrade
            </Link>
          )}

          {/* User */}
          <div className="flex items-center gap-2 border-l border-white/[0.06] pl-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-[10px] font-bold text-brand">
              {operatorName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-sm text-white/60 sm:inline">{operatorName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
