import Link from "next/link";
import { cn, formatWibTime } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { StructureStrip } from "./StructureStrip";
import type { Bulletin } from "../types";

/** The desk's per-instrument board: structure by timeframe, what to watch, entry and exit. */
export function BulletinSection({ bulletins }: { bulletins: Bulletin[] }) {
  if (bulletins.length === 0) return null;
  // API sorts most recent first; active reads go above the watch list.
  const rows = [...bulletins].sort((a, b) => Number(a.status !== "active") - Number(b.status !== "active"));

  return (
    <Panel title="Desk board" sub="Structure by timeframe and what the desk is waiting for">
      <ul className="-my-1 divide-y divide-white/[0.07]">
        {rows.map((b) => {
          const sym = b.symbol.replace("/", "");
          return (
            <li key={b.id} className="grid gap-4 py-4 md:grid-cols-[minmax(0,1fr)_264px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Link href={`/app/instrument/${encodeURIComponent(sym)}`} className="font-num text-[24px] font-semibold leading-6 text-white hover:text-brand">
                    {sym}
                  </Link>
                  <span className={cn("text-[12px] font-semibold uppercase tracking-[0.06em]", b.bias === "bullish" ? "text-up" : b.bias === "bearish" ? "text-down" : "text-white/55")}>
                    {b.bias === "bullish" ? "▲ Bullish" : b.bias === "bearish" ? "▼ Bearish" : "Neutral"}
                  </span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em]", b.status === "active" ? "bg-brand text-black" : "bg-raised text-white/55")}>
                    {b.status}
                  </span>
                  <span className="text-[12px] text-white/30">{formatWibTime(b.updatedAt)}</span>
                </div>
                {b.whatToWatch && <p className="mt-2 whitespace-pre-wrap text-[14px] leading-[21px] text-white/75">{b.whatToWatch}</p>}
                {(b.entry || b.exit) && (
                  <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
                    {b.entry && (
                      <div className="flex gap-2">
                        <dt className="text-white/40">Entry</dt>
                        <dd className="text-white">{b.entry}</dd>
                      </div>
                    )}
                    {b.exit && (
                      <div className="flex gap-2">
                        <dt className="text-white/40">Exit</dt>
                        <dd className="text-white">{b.exit}</dd>
                      </div>
                    )}
                  </dl>
                )}
                {b.note && <p className="mt-2 whitespace-pre-wrap text-[13px] text-white/40">{b.note}</p>}
              </div>
              <StructureStrip levels={b.levels} size={26} />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
