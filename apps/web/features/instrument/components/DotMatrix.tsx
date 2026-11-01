import { cn } from "@/lib/cn";
import type { NewsListItem } from "@/features/news/queries/news";

/**
 * Square-dot terminal graphics. Every dot encodes a value; nothing here is
 * decoration. Dots are 4px squares on a 6px pitch.
 */
const D = 4;
const P = 6;
const OFF = "rgba(255,255,255,.08)";
const BRAND = "#FFD400";
const UP = "#00DD94";
const DOWN = "#FF454D";

function Dots({ cols, rows, fill, label, className = "block h-auto w-full", scale }: { cols: number; rows: number; fill: (c: number, r: number) => string; label: string; className?: string; scale?: number }) {
  const cells = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) cells.push(<rect key={`${c}-${r}`} x={c * P} y={r * P} width={D} height={D} fill={fill(c, r)} />);
  return (
    <svg
      viewBox={`0 0 ${cols * P - (P - D)} ${rows * P - (P - D)}`}
      width={scale ? (cols * P - (P - D)) * scale : undefined}
      height={scale ? (rows * P - (P - D)) * scale : undefined}
      className={className} role="img" aria-label={label}>
      {cells}
    </svg>
  );
}

/** Share of the daily ATR travelled. 30 columns = 0..150%, the 100% column stays lit. */
export function AtrGauge({ usedPct }: { usedPct: number }) {
  const cols = 30;
  const filled = Math.min(cols, Math.round(usedPct / 5));
  return (
    <Dots
      cols={cols}
      rows={3}
      label={`${Math.round(usedPct)}% of daily ATR used`}
      fill={(c) => (c < filled ? (c >= 20 ? DOWN : BRAND) : c === 19 ? "rgba(255,255,255,.35)" : OFF)}
    />
  );
}

/** RSI as 20 dots of 5 points each; the 30 and 70 bands are tinted when empty. */
export function RsiMeter({ rsi }: { rsi: number | null }) {
  const filled = rsi === null ? 0 : Math.round(rsi / 5);
  return (
    <Dots
      cols={20}
      rows={2}
      label={rsi === null ? "RSI unavailable" : `RSI ${rsi.toFixed(1)}`}
      fill={(c) => (c < filled ? (rsi! <= 30 ? UP : rsi! >= 70 ? DOWN : BRAND) : c < 6 || c >= 14 ? "rgba(255,255,255,.14)" : OFF)}
    />
  );
}

// ponytail: fixed UTC session hours, ignores DST shifts of an hour; derive from tz rules if users notice.
const SESSIONS = [
  { name: "New York", from: 12, to: 21 },
  { name: "London", from: 7, to: 16 },
  { name: "Asia", from: 0, to: 9 },
] as const;

const openAt = (s: (typeof SESSIONS)[number], h: number) => h >= s.from && h < s.to;

/** Three rings of 24 hour-dots (UTC), outer New York, inner Asia. The current hour is white. */
export function SessionRing({ now = new Date() }: { now?: Date }) {
  const h = now.getUTCHours();
  const open = SESSIONS.filter((s) => openAt(s, h)).map((s) => s.name);
  const R = [46, 36, 26];
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 108 108" className="h-[108px] w-[108px] shrink-0" role="img" aria-label={`Open now: ${open.join(", ") || "none"}`}>
        {SESSIONS.map((s, k) =>
          Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * 2 * Math.PI - Math.PI / 2;
            const lit = openAt(s, i);
            return (
              <rect
                key={`${s.name}-${i}`}
                x={54 + R[k]! * Math.cos(a) - 2}
                y={54 + R[k]! * Math.sin(a) - 2}
                width={4}
                height={4}
                fill={i === h ? (lit ? "#fff" : "rgba(255,255,255,.45)") : lit ? BRAND : OFF}
                opacity={lit && i !== h ? 0.75 : 1}
              />
            );
          }),
        )}
        <text x={54} y={56} textAnchor="middle" fill="rgba(255,255,255,.9)" fontSize={16} fontWeight={600} fontFamily='"Barlow Condensed", sans-serif'>
          {String(h).padStart(2, "0")}:00
        </text>
        <text x={54} y={66} textAnchor="middle" fill="rgba(255,255,255,.4)" fontSize={8} letterSpacing=".08em">
          UTC
        </text>
      </svg>
      <ul className="space-y-1 font-mono text-[11px] uppercase tracking-[0.06em]">
        {SESSIONS.map((s) => (
          <li key={s.name} className={cn(openAt(s, h) ? "text-white" : "text-white/30")}>
            <span className={cn("mr-2 inline-block h-1.5 w-1.5", openAt(s, h) ? "bg-brand" : "bg-white/15")} aria-hidden />
            {s.name} {openAt(s, h) ? "open now" : `opens in ${(s.from - h + 24) % 24}h`}
          </li>
        ))}
      </ul>
    </div>
  );
}

// 5x5 dot glyphs, rows top to bottom.
const GLYPH = {
  bullish: ["..#..", ".###.", "#.#.#", "..#..", "..#.."],
  bearish: ["..#..", "..#..", "#.#.#", ".###.", "..#.."],
  neutral: [".....", ".....", "#####", ".....", "....."],
} as const;

/** Market structure for one timeframe as a 5x5 dot arrow. */
export function StructureGlyph({ bias, size = 30 }: { bias: keyof typeof GLYPH | null; size?: number }) {
  const g = bias ? GLYPH[bias] : null;
  const color = bias === "bullish" ? UP : bias === "bearish" ? DOWN : "rgba(255,255,255,.55)";
  return (
    <svg viewBox="0 0 28 28" width={size} height={size} role="img" aria-label={bias ?? "no read"}>
      {Array.from({ length: 25 }, (_, i) => {
        const r = Math.floor(i / 5);
        const c = i % 5;
        return <rect key={i} x={c * P} y={r * P} width={D} height={D} fill={g?.[r]?.[c] === "#" ? color : OFF} />;
      })}
    </svg>
  );
}

/** One column per day, up to 5 dots per day, coloured by that day's net bias. */
export function NewsPulse({ days }: { days: { count: number; net: number }[] }) {
  return (
    <Dots
      cols={days.length}
      rows={5}
      label={`${days.reduce((n, d) => n + d.count, 0)} items in ${days.length} days`}
      fill={(c, r) => {
        const d = days[c]!;
        if (4 - r >= Math.min(5, d.count)) return OFF;
        return d.net > 0 ? UP : d.net < 0 ? DOWN : "rgba(255,255,255,.6)";
      }}
    />
  );
}

/** Per-UTC-day item count and net bias for the last `days` days, oldest first. */
export function newsPulse(news: NewsListItem[], days = 90) {
  const today = Math.floor(Date.now() / 86_400_000);
  const out = Array.from({ length: days }, () => ({ count: 0, net: 0 }));
  for (const n of news) {
    const i = days - 1 - (today - Math.floor(new Date(n.publishedAt ?? n.fetchedAt).getTime() / 86_400_000));
    if (i < 0 || i >= days) continue;
    out[i]!.count++;
    out[i]!.net += n.bias === "bullish" ? 1 : n.bias === "bearish" ? -1 : 0;
  }
  return out;
}

/** 13 weeks as a calendar: one column per week, Monday on top. Brightness = item count, colour = net bias. */
export function NewsCalendar({ days }: { days: { count: number; net: number }[] }) {
  // Pad the front so the last day (today) lands on its weekday row.
  const todayRow = (new Date().getUTCDay() + 6) % 7;
  const lead = (((todayRow - (days.length - 1)) % 7) + 7) % 7;
  const grid: ({ count: number; net: number } | null)[] = [...Array<null>(lead).fill(null), ...days];
  const cols = Math.ceil(grid.length / 7);
  return (
    <Dots
      className="block max-w-full"
      scale={2.3}
      cols={cols}
      rows={7}
      label={`${days.reduce((n, d) => n + d.count, 0)} items in ${days.length} days`}
      fill={(c, r) => {
        const d = grid[c * 7 + r];
        if (!d) return "transparent";
        if (d.count === 0) return OFF;
        const base = d.net > 0 ? "0,221,148" : d.net < 0 ? "255,69,77" : "255,255,255";
        return `rgba(${base},${Math.min(1, 0.35 + d.count * 0.2)})`;
      }}
    />
  );
}

/** Diverging strip: centre column is zero, green dots grow right for +, red dots grow left for -. */
export function StrengthBar({ value, max }: { value: number; max: number }) {
  const half = 10;
  const n = Math.min(half, Math.round((Math.abs(value) / (max || 1)) * half));
  return (
    <Dots
      cols={half * 2 + 1}
      rows={2}
      label={`${value >= 0 ? "+" : ""}${value.toFixed(2)}%`}
      fill={(c) => {
        if (c === half) return "rgba(255,255,255,.35)";
        if (value >= 0 && c > half && c <= half + n) return UP;
        if (value < 0 && c < half && c >= half - n) return DOWN;
        return OFF;
      }}
    />
  );
}
