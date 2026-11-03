import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/cn";
import { DateBlock, countdownLabel, relativeSync } from "@/features/unlocks/components/UnlocksView";
import {
  categoryLabel,
  daysUntil,
  type UpgradeEvent,
  type UpgradeRadarData,
} from "@/features/upgrades/types";

const EYEBROW = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";

function impactTone(impact: string | null) {
  return impact === "high" ? "text-brand" : impact === "medium" ? "text-white" : "text-white/40";
}

function UpgradeRow({ e }: { e: UpgradeEvent }) {
  const days = daysUntil(e.dateStart);
  return (
    <li className="flex items-center gap-4 py-3.5">
      <DateBlock iso={e.dateStart} approx={e.dateApprox} />
      <div className="min-w-0 flex-1">
        <p className="truncate">
          <span className="text-[15px] font-semibold text-white">{e.symbol}</span>
          <span className="ml-2 text-[13px] text-white/40">
            {e.name}
            <span className="px-1.5 text-white/20">/</span>#{e.mcapRank}
          </span>
        </p>
        <p className="mt-0.5 text-[14px] leading-[21px] text-white/75">{e.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={cn("mr-1 text-[13px] font-medium", days <= 7 ? "text-brand" : "text-white/55")}>
            {countdownLabel(e.dateStart, e.dateApprox)}
          </span>
          <span className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] capitalize text-white/60">
            {categoryLabel(e.category).toLowerCase()}
          </span>
          <a
            href={e.source}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-[12px] font-medium text-white/40 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            Proof ↗
          </a>
        </div>
      </div>
      <div className="w-16 shrink-0 text-right">
        <p className={cn("font-num text-[24px] font-semibold leading-7", impactTone(e.impact))}>
          {e.impactScore != null ? e.impactScore.toFixed(1) : "n/a"}
        </p>
        <p className="text-[12px] capitalize text-white/40">{e.impact ?? "unrated"}</p>
      </div>
    </li>
  );
}

/** Page grid shared by the live, empty, unavailable and locked states. */
export function UpgradeRadarShell({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">{children}</div>
      <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
        {aside}
        <Panel title="How it works">
          <p className="text-[14px] leading-[21px] text-white/55">
            Dated network catalysts for top-200 coins over the next 90 days: hard forks, mainnets and major upgrades. Best used in bull markets.
          </p>
        </Panel>
      </aside>
    </div>
  );
}

function Summary({ data }: { data: UpgradeRadarData }) {
  const week = data.events.filter((e) => daysUntil(e.dateStart) <= 7).length;
  const high = data.events.filter((e) => e.impact === "high").length;
  const cats = new Map<string, number>();
  for (const e of data.events) cats.set(e.category, (cats.get(e.category) ?? 0) + 1);
  const stats: [string, number, string?][] = [
    ["On radar", data.events.length],
    ["This week", week, week > 0 ? "text-brand" : undefined],
    ["High impact", high, high > 0 ? "text-brand" : undefined],
  ];
  return (
    <Panel title="Next 90 days" sub={`Tracking ${data.trackedTop200} of top-200, synced ${relativeSync(data.updatedAt)}`}>
      <dl className="grid grid-cols-3 gap-x-4">
        {stats.map(([k, v, tone]) => (
          <div key={k}>
            <dt className={EYEBROW}>{k}</dt>
            <dd className={cn("font-num text-[28px] font-semibold leading-8 text-white", tone)}>{v}</dd>
          </div>
        ))}
      </dl>
      {cats.size > 0 && (
        <ul className="mt-4 divide-y divide-white/[0.07] border-t border-white/[0.07]">
          {[...cats].sort((a, b) => b[1] - a[1]).map(([c, n]) => (
            <li key={c} className="flex items-center justify-between py-2 text-[14px] capitalize text-white/75">
              {categoryLabel(c).toLowerCase()}
              <span className="font-num text-[18px] text-white/55">{n}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[12px] text-white/30">Source: CoinMarketCal</p>
    </Panel>
  );
}

export function UpgradeRadarView({ data }: { data: UpgradeRadarData }) {
  return (
    <UpgradeRadarShell aside={<Summary data={data} />}>
      <Panel title="Upcoming catalysts" sub="Soonest first, dates in WIB. Right: CoinMarketCal impact score.">
        {data.events.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-white/40">
            No top-200 network upgrade in the next {data.horizonDays} days.
          </p>
        ) : (
          <ul className="-my-1 divide-y divide-white/[0.07]">
            {data.events.map((e) => (
              <UpgradeRow key={e.id} e={e} />
            ))}
          </ul>
        )}
      </Panel>
    </UpgradeRadarShell>
  );
}
