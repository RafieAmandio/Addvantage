"use client";

import { useEffect, useState } from "react";
import { useAppState, isPaid } from "@/lib/state";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import type { Tier } from "@/lib/mock/types";

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
  const [stamp, setStamp] = useState("");
  const [isMac, setIsMac] = useState(false);

  const flipTier = (next: Tier) => {
    if (next === tier) return;
    setTier(next);
    toast.push({
      tone: next === "vip" ? "success" : "info",
      title: next === "vip" ? "Tier · VIP+ Trader" : "Tier · Free",
      description:
        next === "vip"
          ? "All locked surfaces unlocked. Trading Plan, 1v1 Consultation, full Education library."
          : "Returning to free tier. Locked surfaces will require upgrade.",
      duration: 2500,
    });
  };

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  useEffect(() => {
    const tick = () =>
      setStamp(new Date().toUTCString().slice(5, 16).toUpperCase());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-3 bg-black/95 backdrop-blur">
      {/* Classification stripe */}
      <div className="classification-stripe h-1" />

      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="border border-gray-3 p-2 text-white/70 hover:border-brand hover:text-brand lg:hidden"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M1 3h12M1 7h12M1 11h12" />
            </svg>
          </button>

          {/* Desktop expand sidebar — only when collapsed */}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              aria-label="Expand sidebar"
              title="Expand sidebar · \\"
              className="hidden items-center gap-1 border border-gray-3 p-2 text-white/70 hover:border-brand hover:text-brand lg:flex"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                {/* Chevron right — distinct from the mobile hamburger */}
                <path
                  d="M5 2l5 5-5 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M2 3v8" strokeLinecap="round" />
              </svg>
            </button>
          )}

          <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            ● <span className="hidden sm:inline">TRANSMISSION </span>LIVE
          </div>
          <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-widest2 text-white/40 sm:flex">
            <span>NODE 04</span>
            <span className="text-brand/40">/</span>
            <span>BRIEF 088</span>
            <span className="text-brand/40">/</span>
            <span suppressHydrationWarning>{stamp || "—"}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Dev tier toggle */}
          <div className="flex items-center gap-1 border border-gray-3 bg-black-2 p-1">
            <button
              onClick={() => flipTier("free")}
              className={cn(
                "px-3 py-1 font-mono text-[9px] uppercase tracking-widest2 transition-colors",
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
                "px-3 py-1 font-mono text-[9px] uppercase tracking-widest2 transition-colors",
                paid
                  ? "bg-brand text-black"
                  : "text-white/40 hover:text-white"
              )}
            >
              VIP+
            </button>
          </div>

          {/* Search trigger — visible on all sizes */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search the DOMAIN"
            className="group flex items-center gap-2 border border-gray-3 bg-black-2 px-3 py-1.5 text-white/50 transition-colors hover:border-brand hover:text-brand sm:gap-3"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <circle cx="9" cy="9" r="6" />
              <path d="M14 14l4 4" strokeLinecap="round" />
            </svg>
            <span className="hidden font-mono text-[10px] uppercase tracking-widest2 sm:inline">
              Search
            </span>
            <span className="hidden items-center gap-1 lg:flex">
              <kbd className="border border-gray-3 bg-black px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                {isMac ? "⌘" : "Ctrl"}
              </kbd>
              <kbd className="border border-gray-3 bg-black px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                K
              </kbd>
            </span>
          </button>

          <NotificationBell />

          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("ants:help-toggle"))
            }
            aria-label="Show keyboard shortcuts and help"
            title="Press ? for keyboard shortcuts"
            className="border border-gray-3 bg-black-2 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand"
          >
            ?
          </button>

          <Link
            href="/app/subscription"
            className="hidden border border-brand/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-brand hover:bg-brand hover:text-black sm:block"
          >
            {paid ? "Manage tier" : "Upgrade →"}
          </Link>

          <div className="flex items-center gap-2 border-l border-gray-3 pl-4 font-mono text-[10px] uppercase tracking-widest2 text-white/60">
            <span className="led" />
            <span className="hidden sm:inline">{operatorName.toUpperCase()}</span>
            <span className="text-white/30 hidden lg:inline">·</span>
            <span className="text-white/40 hidden lg:inline">U-00417</span>
          </div>
        </div>
      </div>
    </header>
  );
}
