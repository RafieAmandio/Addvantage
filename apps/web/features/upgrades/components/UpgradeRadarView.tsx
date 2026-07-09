import { cn } from "@/lib/cn";
import {
  categoryLabel,
  daysUntil,
  type UpgradeEvent,
  type UpgradeRadarData,
} from "@/features/upgrades/types";

export function UpgradeRadarHeader({ count }: { count: number | null }) {
  return (
    <div className="border-b border-white/[0.06] px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <h1 className="font-mono text-lg font-bold text-white">Upgrade Radar</h1>
        {count !== null && count > 0 && (
          <span className="flex items-center gap-1.5 rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-white/30">
            <span className="led" aria-hidden />
            {count} on radar
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-white/30">
        Dated network catalysts — hard forks, mainnets, major upgrades — for top-200
        coins, next 90 days. Best used in bull markets.
      </p>
    </div>
  );
}

function Countdown({ iso, approx }: { iso: string; approx: boolean }) {
  const days = daysUntil(iso);
  return (
    <span
      className={cn(
        "font-mono text-[11px] font-bold uppercase tracking-widest2",
        days <= 7 ? "text-brand" : "text-white/60",
      )}
    >
      {days === 0 ? "TODAY" : `IN ${approx ? "~" : ""}${days}D`}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="border border-white/[0.08] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/50">
      {categoryLabel(category)}
    </span>
  );
}

function ImpactBadge({ impact }: { impact: string | null }) {
  if (!impact) return null;
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest2",
        impact === "high"
          ? "bg-brand/15 text-brand"
          : impact === "medium"
            ? "text-white/60"
            : "text-white/30",
      )}
    >
      {impact}
    </span>
  );
}

// CMC's displayDate is sometimes a real date ("29 Jul", "Jul 2026") and
// sometimes just a countdown ("IN ~3D") that would duplicate the Countdown.
// Prefer a real date string; otherwise format dateStart (prefixed ~ if approx).
function secondaryDate(e: UpgradeEvent): string {
  const d = (e.displayDate || "").trim();
  if (d && !/^(in\b|ongoing)/i.test(d)) return d;
  const formatted = new Date(e.dateStart).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return e.dateApprox ? `~${formatted}` : formatted;
}

function SourceLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand"
    >
      proof ↗
    </a>
  );
}

function DesktopTable({ events }: { events: UpgradeEvent[] }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-white/[0.06] font-mono text-[9px] uppercase tracking-widest2 text-white/30">
          <th className="px-6 py-3 text-left">Catalyst</th>
          <th className="px-3 py-3 text-left">Coin</th>
          <th className="px-3 py-3 text-right">Rank</th>
          <th className="px-3 py-3 text-left">Event</th>
          <th className="px-3 py-3 text-right">Type</th>
          <th className="px-6 py-3 text-right">Source</th>
        </tr>
      </thead>
      <tbody>
        {events.map((e) => (
          <tr
            key={e.id}
            className="border-b border-white/[0.06] transition-colors hover:bg-white/[0.02]"
          >
            <td className="px-6 py-4 align-top">
              <Countdown iso={e.dateStart} approx={e.dateApprox} />
              <div className="mt-0.5 font-mono text-[10px] text-white/30">{secondaryDate(e)}</div>
            </td>
            <td className="px-3 py-4 align-top">
              <span className="font-mono text-sm font-bold text-white">{e.symbol}</span>
              <span className="ml-2 text-xs text-white/40">{e.name}</span>
            </td>
            <td className="px-3 py-4 text-right align-top font-mono text-xs tabular-nums text-white/40">
              #{e.mcapRank}
            </td>
            <td className="px-3 py-4 align-top">
              <span className="text-sm text-white/70">{e.title}</span>
            </td>
            <td className="px-3 py-4 text-right align-top">
              <span className="flex flex-wrap justify-end gap-1">
                <ImpactBadge impact={e.impact} />
                <CategoryBadge category={e.category} />
              </span>
            </td>
            <td className="px-6 py-4 text-right align-top">
              <SourceLink href={e.source} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MobileList({ events }: { events: UpgradeEvent[] }) {
  return (
    <div>
      {events.map((e) => (
        <div key={e.id} className="border-b border-white/[0.06] px-4 py-4">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-mono text-sm font-bold text-white">{e.symbol}</span>
              <span className="ml-2 text-xs text-white/40">#{e.mcapRank}</span>
            </div>
            <Countdown iso={e.dateStart} approx={e.dateApprox} />
          </div>
          <p className="mt-2 text-sm text-white/70">{e.title}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-white/30">{secondaryDate(e)}</span>
            <span className="flex flex-wrap justify-end gap-1">
              <ImpactBadge impact={e.impact} />
              <CategoryBadge category={e.category} />
            </span>
          </div>
          <div className="mt-2 text-right">
            <SourceLink href={e.source} />
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

export function ContextFooter({ data }: { data: UpgradeRadarData }) {
  return (
    <div className="border-t border-white/[0.06] px-4 py-3 font-mono text-[10px] uppercase tracking-widest2 text-white/40 sm:px-6">
      tracking {data.trackedTop200} of top-200 · source: coinmarketcal · synced{" "}
      {relativeSync(data.updatedAt)}
    </div>
  );
}

export function UpgradeRadarView({ data }: { data: UpgradeRadarData }) {
  return (
    <div className="min-h-screen">
      <UpgradeRadarHeader count={data.events.length} />
      {data.events.length === 0 ? (
        <div className="px-4 py-20 text-center sm:px-6">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            ● No catalysts on radar
          </div>
          <p className="mt-3 text-sm text-white/30">
            No top-200 network upgrade in the next {data.horizonDays} days.
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
