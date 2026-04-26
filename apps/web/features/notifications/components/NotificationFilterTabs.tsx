"use client";

import { cn } from "@/lib/cn";
import type { NotifFilter } from "@/features/notifications/lib/filters";

interface Props {
  filter: NotifFilter;
  unreadCount: number;
  onChange: (f: NotifFilter) => void;
  className?: string;
}

export function NotificationFilterTabs({
  filter,
  unreadCount,
  onChange,
  className,
}: Props) {
  const tabs: Array<{ v: NotifFilter; label: string }> = [
    { v: "all", label: "All" },
    { v: "unread", label: `Unread · ${unreadCount}` },
    { v: "alert", label: "Alert" },
    { v: "plan", label: "Plan" },
    { v: "consult", label: "Consult" },
    { v: "education", label: "Edu" },
    { v: "system", label: "System" },
  ];
  return (
    <div
      className={cn(
        "flex flex-wrap gap-px overflow-x-auto border-b border-gray-3 bg-gray-2/60 p-2",
        className
      )}
    >
      {tabs.map((f) => (
        <button
          key={f.v}
          onClick={() => onChange(f.v)}
          className={cn(
            "whitespace-nowrap px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest2 transition-colors focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none",
            filter === f.v
              ? "bg-brand text-black"
              : "bg-black text-white/60 hover:text-white"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
