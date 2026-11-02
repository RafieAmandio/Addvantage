"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BoardRow } from "@tradevantage/shared";
import { cn } from "@/lib/cn";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { VERDICT, wib } from "../lib/explain";
import { shortName } from "../lib/overlays";
import { GROUPS, groupOf, sameSymbol } from "../lib/board";
import { Popover } from "./Popover";

const flat = (s: string) => s.replace("/", "");
const CHIP = { order: "text-brand", watch: "text-white", pass: "text-white/40" } as const;

/** TradingView-style symbol search that doubles as the board: every market grouped by how ready its strongest level is. */
export function SymbolPicker({ rows, symbol, price, loading, onPick }: { rows: BoardRow[]; symbol: string; price: number | null; loading: boolean; onPick: (symbol: string) => void }) {
  return (
    <Popover
      label="Markets"
      panelClass="sm:w-[480px] sm:p-0"
      triggerClass={(open) => cn("flex h-9 items-center gap-2 rounded-lg px-2.5 transition duration-150 motion-safe:active:scale-[0.98]", open ? "bg-white/[0.1]" : "hover:bg-white/[0.06]")}
      trigger={(open) => (
        <>
          <span className="font-num text-[18px] font-semibold text-white">{flat(symbol)}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className={cn("text-white/55 transition-transform", open && "rotate-180")}>
            <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {price !== null && <span className={cn("font-num text-[15px] text-white/70", loading && "opacity-40")}>{fmtPrice(price)}</span>}
        </>
      )}
    >
      {(close) => <List rows={rows} symbol={symbol} onPick={(s) => (onPick(s), close())} />}
    </Popover>
  );
}

function List({ rows, symbol, onPick }: { rows: BoardRow[]; symbol: string; onPick: (symbol: string) => void }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const needle = q.trim().toUpperCase().replace("/", "");
    const xs = rows.filter((r) => !needle || flat(r.symbol).includes(needle) || r.label.toUpperCase().includes(needle));
    // Flattened in group order so the arrow keys walk the list as drawn.
    return GROUPS.flatMap(([g]) => xs.filter((r) => groupOf(r) === g));
  }, [rows, q]);
  const [active, setActive] = useState(() => Math.max(0, shown.findIndex((r) => sameSymbol(r.symbol, symbol))));
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);
  const asOf = rows.map((r) => r.asOf).filter(Boolean).sort().at(-1);
  const count = (g: string) => rows.filter((r) => groupOf(r) === g).length;
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, Math.min(shown.length - 1, i + (e.key === "ArrowDown" ? 1 : -1))));
    }
    if (e.key === "Enter" && shown[active]) onPick(shown[active].symbol);
  };

  let i = -1;
  return (
    <div>
      <div className="sm:border-b sm:border-white/[0.07] sm:p-3">
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKey}
          placeholder="Search markets"
          role="combobox"
          aria-expanded
          aria-controls="lab-markets"
          aria-activedescendant={shown[active] ? `lab-m-${active}` : undefined}
          className="h-10 w-full rounded-lg bg-black/40 px-3 text-[15px] text-white outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-white/30"
        />
        <p className="mt-2 text-[12px] text-white/45">
          <span className="font-num font-semibold text-brand">{count("here")}</span> at level now · <span className="font-num font-semibold text-white">{count("order")}</span> meet every rule ·{" "}
          <span className="font-num font-semibold text-white">{count("watch")}</span> need confirmation · <span className="font-num">{count("pass")}</span> don&apos;t qualify
          {asOf && <span className="block text-white/30">Daily read from the {wib(asOf, false)} close · hourly levels refresh every hour</span>}
        </p>
      </div>
      <div ref={box} id="lab-markets" role="listbox" aria-label="Markets" className="mt-2 sm:mt-0 sm:max-h-[min(60vh,520px)] sm:overflow-y-auto sm:p-1.5">
        {shown.length === 0 && <p className="px-3 py-4 text-[14px] text-white/40">No market matches.</p>}
        {GROUPS.map(([g, title]) => {
          const xs = shown.filter((r) => groupOf(r) === g);
          if (!xs.length) return null;
          return (
            <div key={g} role="group" aria-label={title}>
              <p className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">{title}</p>
              {xs.map((r) => {
                i++;
                const k = i;
                const l = r.level;
                const cur = sameSymbol(r.symbol, symbol);
                return (
                  <div
                    key={r.symbol}
                    id={`lab-m-${k}`}
                    data-i={k}
                    role="option"
                    aria-selected={k === active}
                    onMouseMove={() => setActive(k)}
                    onClick={() => onPick(r.symbol)}
                    className={cn("grid cursor-pointer grid-cols-[5.5rem_minmax(0,1fr)_3rem] items-center gap-3 rounded-lg px-2.5 py-2 sm:grid-cols-[6rem_minmax(0,1fr)_3rem_3.5rem]", k === active && "bg-white/[0.07]")}
                  >
                    <span className={cn("font-num text-[15px] font-semibold", cur ? "text-brand" : "text-white")}>{flat(r.symbol)}</span>
                    <span className="min-w-0">
                      {l && r.call !== "pass" ? (
                        <span className="block truncate text-[13px] text-white/80">
                          <span className={l.side === "buy" ? "text-up" : "text-down"}>{l.side === "buy" ? "Buy" : "Sell"}</span> {shortName(l)} <span className="font-num">{fmtPrice(l.price)}</span>
                        </span>
                      ) : (
                        <span className="block truncate text-[13px] text-white/40">{r.why}</span>
                      )}
                      <span className={cn("block truncate text-[11px] font-semibold", g === "here" ? "text-brand" : CHIP[r.call])}>{g === "here" ? `At level now · ${VERDICT[r.call].label}` : VERDICT[r.call].label}</span>
                    </span>
                    <span className="text-right font-num text-[14px] font-semibold text-white/80">{l?.r != null && r.call !== "pass" ? `${l.r.toFixed(2)}R` : ""}</span>
                    <span className="hidden items-center justify-end gap-1.5 sm:flex">
                      {l && r.call !== "pass" && (
                        <>
                          <span className="h-1 w-6 overflow-hidden rounded-full bg-white/10" aria-hidden>
                            <span className="block h-full bg-brand" style={{ width: `${l.score}%` }} />
                          </span>
                          <span className="font-num text-[12px] text-white/50" aria-label={`Strength ${l.score}`}>
                            {l.score}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
