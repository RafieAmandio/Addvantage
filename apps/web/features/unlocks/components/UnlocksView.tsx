import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/cn";
import {
  compactUsd,
  daysUntil,
  type UnlockEvent,
  type UnlocksData,
} from "@/features/unlocks/types";

const EYEBROW = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";

/** Calendar-style date block (WIB): month eyebrow over a condensed day number. */
export function DateBlock({ iso, approx = false }: { iso: string; approx?: boolean }) {
  const d = new Date(iso);
  const month = d.toLocaleDateString("en-GB", { timeZone: "Asia/Jakarta", month: "short" });
  const day = d.toLocaleDateString("en-GB", { timeZone: "Asia/Jakarta", day: "2-digit" });
  return (
    <div className="w-11 shrink-0 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">{month}</p>
      <p className="font-num text-[26px] font-semibold leading-7 text-white">
        {approx && <span className="text-white/40">~</span>}
        {day}
      </p>
    </div>
  );
}

export function countdownLabel(iso: string, approx = false): string {
  const days = daysUntil(iso);
  if (days === 0) return "Today";
  return `In ${approx ? "~" : ""}${days} ${days === 1 ? "day" : "days"}`;
}

function UnlockRow({ e }: { e: UnlockEvent }) {
  const days = daysUntil(e.unlockAt);
  return (
    <li className="flex items-center gap-4 py-3.5">
      <DateBlock iso={e.unlockAt} />
      <div className="min-w-0 flex-1">
        <p className="truncate">
          <span className="text-[15px] font-semibold text-white">{e.symbol}</span>
          <span className="ml-2 text-[13px] text-white/40">
            {e.name}
            <span className="px-1.5 text-white/20">/</span>#{e.mcapRank}
          </span>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={cn("mr-1 text-[13px] font-medium", days <= 7 ? "text-brand" : "text-white/55")}>
            {countdownLabel(e.unlockAt)}
          </span>
          {e.categories.map((c) => (
            <span key={c} className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] capitalize text-white/60">
              {c}
            </span>
          ))}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn("font-num text-[24px] font-semibold leading-7", e.pctSupply > 10 ? "text-down" : "text-white")}>
          {e.pctSupply.toFixed(1)}%
        </p>
        <p className="text-[12px] text-white/40">{compactUsd(e.usdValue)}</p>
      </div>
    </li>
  );
}

export function relativeSync(iso: string | null): string {
  if (!iso) return "never";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** Page grid shared by the live, empty, unavailable and locked states. */
export function UnlocksShell({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">{children}</div>
      <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
        {aside}
        <Panel title="How it works">
          <p className="text-[14px] leading-[21px] text-white/55">
            Unlock events above 4.9% of circulating supply, top-200 market cap only, next 90 days. Large unlocks tend to precede sell pressure.
          </p>
        </Panel>
      </aside>
    </div>
  );
}

function Summary({ data }: { data: UnlocksData }) {
  const total = data.events.reduce((s, e) => s + e.usdValue, 0);
  const week = data.events.filter((e) => daysUntil(e.unlockAt) <= 7).length;
  const largest = data.events.reduce<UnlockEvent | null>((m, e) => (!m || e.pctSupply > m.pctSupply ? e : m), null);
  const stats: [string, React.ReactNode, string?][] = [
    ["On radar", data.events.length],
    ["This week", week, week > 0 ? "text-brand" : undefined],
    ["Value", compactUsd(total)],
    ["Largest", largest ? `${largest.pctSupply.toFixed(1)}%` : "0%", largest && largest.pctSupply > 10 ? "text-down" : undefined],
  ];
  return (
    <Panel title="Next 90 days" sub={`Tracking ${data.trackedTop200} of top-200, synced ${relativeSync(data.updatedAt)}`}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {stats.map(([k, v, tone]) => (
          <div key={k}>
            <dt className={EYEBROW}>{k}</dt>
            <dd className={cn("font-num text-[28px] font-semibold leading-8 text-white", tone)}>{v}</dd>
          </div>
        ))}
      </dl>
      {largest && (
        <p className="mt-3 text-[13px] text-white/55">
          Largest: {largest.symbol}, {countdownLabel(largest.unlockAt).toLowerCase()}
        </p>
      )}
      <p className="mt-3 text-[12px] text-white/30">Source: DefiLlama</p>
    </Panel>
  );
}

export function UnlocksView({ data }: { data: UnlocksData }) {
  return (
    <UnlocksShell aside={<Summary data={data} />}>
      <Panel title="Upcoming unlocks" sub="Soonest first, dates in WIB. Right: % of circulating supply and value.">
        {data.events.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-white/40">
            No top-200 unlock above {data.minPctSupply}% of circulating supply in the next {data.horizonDays} days.
          </p>
        ) : (
          <ul className="-my-1 divide-y divide-white/[0.07]">
            {data.events.map((e) => (
              <UnlockRow key={`${e.geckoId}-${e.unlockAt}`} e={e} />
            ))}
          </ul>
        )}
      </Panel>
    </UnlocksShell>
  );
}
