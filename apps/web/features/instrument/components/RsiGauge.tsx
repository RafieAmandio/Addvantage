"use client";

import { useEffect, useState } from "react";
import { classifyRsi, RSI_ZONES } from "@tradevantage/shared";

interface RsiGaugeProps {
  label: string;
  rsi: number | null;
}

const ZONE_COLORS: Record<string, string> = Object.fromEntries(
  RSI_ZONES.map((z) => [z.id, z.color]),
);

export function RsiGauge({ label, rsi }: RsiGaugeProps) {
  const zone = rsi !== null ? classifyRsi(rsi) : null;
  const color = zone ? ZONE_COLORS[zone] ?? "#6B7280" : "#6B7280";
  const target = rsi !== null ? Math.max(0, Math.min(100, rsi)) : 0;

  const [fill, setFill] = useState(0);
  useEffect(() => {
    if (rsi === null) return;
    const id = requestAnimationFrame(() => setFill(target));
    return () => cancelAnimationFrame(id);
  }, [rsi, target]);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </div>
      {rsi !== null ? (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold" style={{ color }}>
              {rsi.toFixed(2)}
            </span>
            <span className="text-[10px] font-medium uppercase" style={{ color }}>
              {zone}
            </span>
          </div>
          <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-1000 ease-out"
              style={{ width: `${fill}%`, backgroundColor: color }}
            />
            <div className="absolute inset-y-0 left-[30%] w-px bg-white/10" />
            <div className="absolute inset-y-0 left-[70%] w-px bg-white/10" />
          </div>
        </>
      ) : (
        <span className="font-mono text-lg text-white/15">—</span>
      )}
    </div>
  );
}
