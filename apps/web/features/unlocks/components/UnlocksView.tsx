import { cn } from "@/lib/cn";
import {
  compactUsd,
  daysUntil,
  type UnlockEvent,
  type UnlocksData,
} from "@/features/unlocks/types";

export function UnlocksHeader({ count }: { count: number | null }) {
  return (
    <div className="border-b border-white/[0.06] px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <h1 className="font-mono text-lg font-bold text-white">Token Unlocks</h1>
        {count !== null && count > 0 && (
          <span className="flex items-center gap-1.5 rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-white/30">
            <span className="led" aria-hidden />
            {count} critical
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-white/30">
        Supply-shock radar: unlock events above 4.9% of circulating supply, top-200
        market cap only, next 90 days. Large unlocks precede sell pressure.
      </p>
    </div>
  );
}

function Countdown({ iso }: { iso: string }) {
  const days = daysUntil(iso);
  return (
    <span
      className={cn(
        "font-mono text-[11px] font-bold uppercase tracking-widest2",
        days <= 7 ? "text-brand" : "text-white/60",
      )}
    >
      {days === 0 ? "TODAY" : `IN ${days}D`}
    </span>
  );
}

function PctBadge({ pct }: { pct: number }) {
  return (
    <span
      className={cn(
        "font-mono text-sm font-bold tabular-nums",
        pct > 10 ? "text-blood-bright" : "text-white",
      )}
    >
      {pct.toFixed(1)}%
    </span>
  );
}

function CategoryTags({ categories }: { categories: string[] }) {
  return (
    <span className="flex flex-wrap justify-end gap-1">
      {categories.map((c) => (
        <span
          key={c}
          className="border border-white/[0.08] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/50"
        >
          {c}
        </span>
      ))}
    </span>
  );
}

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function DesktopTable({ events }: { events: UnlockEvent[] }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-white/[0.06] font-mono text-[9px] uppercase tracking-widest2 text-white/30">
          <th className="px-6 py-3 text-left">Unlock</th>
          <th className="px-3 py-3 text-left">Token</th>
          <th className="px-3 py-3 text-right">Rank</th>
          <th className="px-3 py-3 text-right">% of supply</th>
          <th className="px-3 py-3 text-right">~Value</th>
          <th className="px-6 py-3 text-right">Allocation</th>
        </tr>
      </thead>
      <tbody>
        {events.map((e) => (
          <tr
            key={`${e.geckoId}-${e.unlockAt}`}
            className="border-b border-white/[0.06] transition-colors hover:bg-white/[0.02]"
          >
            <td className="px-6 py-4">
              <Countdown iso={e.unlockAt} />
              <div className="mt-0.5 font-mono text-[10px] text-white/30">
                {dateLabel(e.unlockAt)}
              </div>
            </td>
            <td className="px-3 py-4">
              <span className="font-mono text-sm font-bold text-white">{e.symbol}</span>
              <span className="ml-2 text-xs text-white/40">{e.name}</span>
            </td>
            <td className="px-3 py-4 text-right font-mono text-xs tabular-nums text-white/40">
              #{e.mcapRank}
            </td>
            <td className="px-3 py-4 text-right">
              <PctBadge pct={e.pctSupply} />
            </td>
            <td className="px-3 py-4 text-right font-mono text-sm tabular-nums text-white/70">
              {compactUsd(e.usdValue)}
            </td>
            <td className="px-6 py-4 text-right">
              <CategoryTags categories={e.categories} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MobileList({ events }: { events: UnlockEvent[] }) {
  return (
    <div>
      {events.map((e) => (
        <div
          key={`${e.geckoId}-${e.unlockAt}`}
          className="border-b border-white/[0.06] px-4 py-4"
        >
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-mono text-sm font-bold text-white">{e.symbol}</span>
              <span className="ml-2 text-xs text-white/40">#{e.mcapRank}</span>
            </div>
            <Countdown iso={e.unlockAt} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <PctBadge pct={e.pctSupply} />
            <span className="font-mono text-xs tabular-nums text-white/60">
              {compactUsd(e.usdValue)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-white/30">
              {dateLabel(e.unlockAt)}
            </span>
            <CategoryTags categories={e.categories} />
          </div>
        </div>
      ))}
    </div>
  );
}

function relativeSync(iso: string | null): string {
  if (!iso) return "never";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function ContextFooter({ data }: { data: UnlocksData }) {
  return (
    <div className="border-t border-white/[0.06] px-4 py-3 font-mono text-[10px] uppercase tracking-widest2 text-white/40 sm:px-6">
      tracking {data.trackedTop200} of top-200 · source: defillama · synced{" "}
      {relativeSync(data.updatedAt)}
    </div>
  );
}

export function UnlocksView({ data }: { data: UnlocksData }) {
  return (
    <div className="min-h-screen">
      <UnlocksHeader count={data.events.length} />
      {data.events.length === 0 ? (
        <div className="px-4 py-20 text-center sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            ● No critical unlocks on radar
          </div>
          <p className="mt-3 text-sm text-white/30">
            No top-200 unlock above {data.minPctSupply}% of circulating supply in the
            next {data.horizonDays} days.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <DesktopTable events={data.events} />
          </div>
          <div className="md:hidden">
            <MobileList events={data.events} />
          </div>
        </>
      )}
      <ContextFooter data={data} />
    </div>
  );
}
