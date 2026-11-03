import { BULLETIN_TIMEFRAMES } from "@tradevantage/shared/schema";
import { StructureGlyph } from "@/features/instrument/components/DotMatrix";
import type { BulletinLevel } from "../types";

/** One dot arrow per timeframe, 1H to 1W, with the break-of-structure level under it. `animate` (ms) lights them 1H first. */
export function StructureStrip({ levels, size = 30, showBos = true, animate = false }: { levels: BulletinLevel[]; size?: number; showBos?: boolean; animate?: number | false }) {
  const byTf = new Map(levels.map((l) => [l.timeframe, l]));
  return (
    <div className="grid grid-cols-6 gap-2">
      {BULLETIN_TIMEFRAMES.map((t, k) => {
        const l = byTf.get(t);
        return (
          <div key={t} className="flex flex-col items-center gap-1" title={l?.comment ?? undefined}>
            <StructureGlyph bias={l?.marketStructure ?? null} size={size} seq={animate === false ? undefined : animate + k * 140} />
            <span className="font-mono text-[11px] text-white/55">{t}</span>
            {showBos && <span className="font-num text-[13px] text-white/40">{l?.bosLevel ?? "·"}</span>}
          </div>
        );
      })}
    </div>
  );
}
