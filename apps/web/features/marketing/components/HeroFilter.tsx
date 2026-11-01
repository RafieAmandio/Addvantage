"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { TickerRow } from "@/features/marketing/lib/landing";
import { WIRE, type WireItem } from "./demos/FilterDemo";
import { play } from "./ScrambleReveal";

const DOTS = 18;
const EVERY = 1700; // ms between headlines
const LIT = 2600; // ms a hit instrument stays lit
const VISIBLE = 5;

type Hit = { dir: "up" | "down"; move: "up" | "down"; code: string; at: number };
type Row = { key: number; item: WireItem; settled?: boolean };

const COMMODITY = ["XAU", "XAG", "WTI"];

/** Which instruments a move touches: pairs that hold the code. A currency move skips metals and oil, so a USD print lights the FX pairs, not everything priced in dollars. */
const touches = (sym: string, code: string) => sym.includes(code) && (!COMMODITY.includes(sym.slice(0, 3)) || sym.startsWith(code));
/** The arrow for the instrument itself: a stronger base pushes the pair up, a stronger quote pushes it down. */
const pairDir = (sym: string, code: string, dir: "up" | "down") => (sym.startsWith(code) ? dir : dir === "up" ? "down" : "up");

/** One wire line: decodes from noise, then is judged. Noise dims, strikes and drops away; a mover flashes and fires its hits. */
function WireLine({ item, settled, onJudged, onGone }: { item: WireItem; settled: boolean; onJudged: (item: WireItem) => void; onGone: () => void }) {
  const [text, setText] = useState(settled ? item.t : "");
  const [phase, setPhase] = useState<"decode" | "judged" | "gone">(settled ? "judged" : "decode");
  const judged = useRef(onJudged);
  judged.current = onJudged;
  const gone = useRef(onGone);
  gone.current = onGone;

  useEffect(() => {
    if (settled) return;
    const stop = play(item.t, 650, setText);
    const t1 = setTimeout(() => {
      setPhase("judged");
      judged.current(item);
    }, 1050);
    const t2 = item.tag ? undefined : setTimeout(() => setPhase("gone"), 2300);
    // Once it has dropped out of sight, take it out of the list so the rows above close the gap.
    const t3 = item.tag ? undefined : setTimeout(() => gone.current(), 3000);
    return () => {
      stop();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [item, settled]);

  const noise = phase !== "decode" && !item.tag;
  const hit = phase !== "decode" && item.tag;
  return (
    <li
      className={cn(
        "grid grid-cols-[3rem_minmax(0,1fr)] gap-x-3 border-b border-white/[0.06] px-3 py-2 font-mono text-[12px] leading-snug transition-[opacity,transform,background-color] duration-700 ease-out md:text-[13px]",
        hit && "lv-flash bg-brand/[0.1]",
        phase === "gone" && "translate-y-3 opacity-0",
      )}
    >
      <span className="tabular-nums text-white/40">{item.at}</span>
      <span className="min-w-0">
        <span className={cn("block truncate transition-colors duration-500", noise ? "text-white/35 line-through decoration-blood-bright" : hit ? "text-white" : "text-white/80")}>{text || " "}</span>
        <span className="mt-1 flex h-[18px] flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em]">
          {phase === "decode" ? (
            <span className="text-white/35">Reading</span>
          ) : item.tag ? (
            <>
              <span className={cn("rounded-[3px] px-1.5 py-px", item.tag.impact === "HIGH" ? "bg-brand text-black" : "border border-brand text-brand")}>{item.tag.impact}</span>
              {item.tag.moves.map(([c, d]) => (
                <span key={c} className={d === "up" ? "text-up" : "text-down"}>
                  {d === "up" ? "▲" : "▼"} {c}
                </span>
              ))}
            </>
          ) : (
            <span className="text-blood-bright">Noise, cut</span>
          )}
        </span>
      </span>
    </li>
  );
}

/**
 * The hero's figure: a sample wire decoding on top, the board's real
 * instruments as dot rows underneath. Movers light the instruments they hit,
 * then fade back. Loops while on screen; reduced motion gets one settled frame.
 */
export function HeroFilter({ ticker }: { ticker: TickerRow[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [calm, setCalm] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [hits, setHits] = useState<Record<string, Hit>>({});
  const [now, setNow] = useState(0);
  const n = useRef(0);

  const fire = useCallback(
    (item: WireItem) => {
      if (!item.tag) return;
      const at = Date.now();
      setHits((h) => {
        const next = { ...h };
        for (const [code, dir] of item.tag!.moves) for (const t of ticker) if (touches(t.sym, code)) next[t.sym] = { dir: pairDir(t.sym, code, dir), move: dir, code, at };
        return next;
      });
      setNow(at);
    },
    [ticker],
  );

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // One settled frame: the last few lines judged, the last two movers' instruments lit.
      setCalm(true);
      const last = WIRE.slice(-VISIBLE);
      setRows(last.map((item, i) => ({ key: i, item })));
      const at = Date.now();
      setNow(at);
      const h: Record<string, Hit> = {};
      for (const item of last.filter((x) => x.tag).slice(-2)) for (const [code, dir] of item.tag!.moves) for (const t of ticker) if (touches(t.sym, code)) h[t.sym] = { dir: pairDir(t.sym, code, dir), move: dir, code, at };
      setHits(h);
      return;
    }
    const el = ref.current;
    if (!el) return;
    // Start mid-stream: a few lines already judged, so the figure is never empty.
    const PRE = 3;
    n.current = PRE;
    setRows(WIRE.slice(0, PRE).map((item, i) => ({ key: -1 - i, item, settled: true })));
    let timer: ReturnType<typeof setInterval> | undefined;
    const add = () => {
      const k = n.current++;
      setRows((r) => [...r, { key: k, item: WIRE[k % WIRE.length]! }].slice(-VISIBLE - 1));
    };
    const io = new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (!e?.isIntersecting) return;
      add();
      timer = setInterval(add, EVERY);
    });
    io.observe(el);
    const fade = setInterval(() => setNow(Date.now()), 400);
    return () => {
      io.disconnect();
      clearInterval(timer);
      clearInterval(fade);
    };
  }, [ticker]);

  const litCount = Object.values(hits).filter((h) => calm || now - h.at < LIT).length;

  return (
    <div ref={ref} className="relative rounded-[10px] border border-white/15 bg-black/70 font-mono text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white/55 md:text-[11px]">
        <span>[ fig. 01 · the filter ]</span>
        <span className="tabular-nums">
          {ticker.length} markets · {litCount} lit
        </span>
      </div>

      <ol className="flex h-[250px] flex-col justify-end overflow-hidden md:h-[292px]" aria-label="Sample news feed">
        {rows.map((r) => (
          <WireLine key={r.key} item={r.item} settled={calm || !!r.settled} onJudged={fire} onGone={() => setRows((x) => x.filter((y) => y.key !== r.key))} />
        ))}
      </ol>

      <ul className="grid gap-y-1.5 border-t border-white/10 px-3 py-3" aria-label="Markets on the board">
        {ticker.map((t) => {
          const h = hits[t.sym];
          const lit = !!h && (calm || now - h.at < LIT);
          return (
            <li key={t.sym} className="grid grid-cols-[4.2rem_minmax(0,1fr)_4.8rem] items-center gap-x-2 text-[10px] md:grid-cols-[4.6rem_minmax(0,1fr)_5.4rem_3.6rem] md:text-[11px]">
              <span className={cn("font-bold transition-colors duration-500", lit ? "text-brand" : "text-white/70")}>{t.sym}</span>
              <span className="flex justify-between gap-[2px]" aria-hidden>
                {Array.from({ length: DOTS }, (_, i) => (
                  <i
                    key={i}
                    className={cn("block aspect-square w-full max-w-[9px] rounded-[1px] transition-colors", lit ? "bg-brand" : "bg-white/[0.12]")}
                    style={{ transitionDuration: lit ? "180ms" : "900ms", transitionDelay: lit ? `${(h!.dir === "up" ? i : DOTS - 1 - i) * 22}ms` : `${i * 12}ms` }}
                  />
                ))}
              </span>
              <span className="text-right tabular-nums text-white/60">{t.val}</span>
              <span className={cn("hidden text-right font-bold transition-opacity duration-500 md:block", lit ? "opacity-100" : "opacity-0", h?.move === "up" ? "text-up" : "text-down")}>
                {h ? `${h.move === "up" ? "▲" : "▼"} ${h.code}` : ""}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="flex justify-between border-t border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-white/45">
        <span>Sample feed. Closes are real, {ticker.length} markets.</span>
        <span className="hidden sm:inline">
          <i className="mr-1 inline-block h-2 w-2 bg-white/20 align-middle" /> idle <i className="ml-2 mr-1 inline-block h-2 w-2 bg-brand align-middle" /> moved
        </span>
      </p>
    </div>
  );
}
