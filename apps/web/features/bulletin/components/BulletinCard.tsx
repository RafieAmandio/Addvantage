import { BiasBadge } from "@/components/ui/Marker";
import { formatWibTime } from "@/lib/cn";
import type { Bulletin } from "../types";

function PlanField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-white/70">{value}</dd>
    </div>
  );
}

export function BulletinCard({ bulletin }: { bulletin: Bulletin }) {
  const { symbol, bias, whatToWatch, entry, exit, note, levels } = bulletin;
  const hasPlan = whatToWatch || entry || exit;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="font-mono text-sm font-bold uppercase tracking-widest2 text-white">
            {symbol}
          </h3>
          <BiasBadge bias={bias} />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
          {formatWibTime(bulletin.updatedAt)}
        </span>
      </div>

      {hasPlan && (
        <dl className="mt-3 grid gap-2 sm:grid-cols-3">
          {whatToWatch && <PlanField label="Watch" value={whatToWatch} />}
          {entry && <PlanField label="Entry" value={entry} />}
          {exit && <PlanField label="Exit" value={exit} />}
        </dl>
      )}

      {levels.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
                <th className="pb-2 pr-3 font-medium">TF</th>
                <th className="pb-2 pr-3 font-medium">Structure</th>
                <th className="pb-2 pr-3 font-medium">BoS Level</th>
                <th className="pb-2 font-medium">Comment</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((l) => (
                <tr key={l.id} className="border-t border-white/[0.05]">
                  <td className="py-2 pr-3 font-mono text-white/70">{l.timeframe}</td>
                  <td className="py-2 pr-3">
                    <BiasBadge bias={l.marketStructure} />
                  </td>
                  <td className="py-2 pr-3 font-mono text-white/60">{l.bosLevel ?? "—"}</td>
                  <td className="py-2 text-white/50">{l.comment ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {note && (
        <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-white/40">{note}</p>
      )}
    </div>
  );
}
