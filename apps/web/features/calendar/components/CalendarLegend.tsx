import { cn } from "@/lib/cn";

const ITEMS: Array<{ title: string; body: string }> = [
  {
    title: "Impact pill",
    body:
      "Overall market impact — High / Mod / Low. Applies to rates, equities, and FX in general.",
  },
  {
    title: "Time format",
    body:
      "HHMM in WIB (UTC+7). The \"+N\" suffix is the day offset from that day's section header.",
  },
];

export function CalendarLegend({ className }: { className?: string }) {
  return (
    <div className={cn("mt-8 border border-gray-3 bg-gray-2/30 p-4", className)}>
      <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
        ● Reading the table
      </div>
      <div className="mt-3 grid grid-cols-1 gap-4 text-sm text-white/70 sm:grid-cols-3">
        {ITEMS.map((item) => (
          <div key={item.title}>
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
              {item.title}
            </div>
            <div className="mt-1 text-xs text-white/60">{item.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
