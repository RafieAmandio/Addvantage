import type { Bar } from "@/features/marketing/lib/landing";

export interface Scale {
  x: (i: number) => number;
  y: (price: number) => number;
  /** Candle slot width. */
  w: number;
  W: number;
  H: number;
}

export function scaleFor(bars: Bar[], { slots = bars.length, prices = [] as number[], W = 600, H = 300, pad = 14, right = 0 } = {}) {
  const lo = Math.min(...bars.map((b) => b[3]), ...prices);
  const hi = Math.max(...bars.map((b) => b[2]), ...prices);
  const span = hi - lo || 1;
  const w = (W - right) / slots;
  const s: Scale = {
    x: (i) => i * w + w / 2,
    y: (p) => pad + (1 - (p - lo) / span) * (H - pad * 2),
    w,
    W,
    H,
  };
  return { s, price: (y: number) => lo + (1 - (y - pad) / (H - pad * 2)) * span };
}

/**
 * Candles as plain SVG, sized by a viewBox so they scale with the panel. `slots`
 * reserves room on the right for bars that arrive later; `prices` keeps extra
 * levels in frame. Overlays draw through the render prop with the same scale.
 */
export function Candles({
  bars,
  slots = bars.length,
  prices = [],
  W = 600,
  H = 300,
  pad = 14,
  right = 0,
  className,
  candleClass,
  children,
  label,
  up: upColor = "#00DD94",
  down: downColor = "#FF454D",
}: {
  bars: Bar[];
  slots?: number;
  prices?: number[];
  W?: number;
  H?: number;
  pad?: number;
  /** Extra empty room on the right, in px of the viewBox. */
  right?: number;
  className?: string;
  candleClass?: (i: number) => string | undefined;
  children?: (s: Scale) => React.ReactNode;
  label: string;
  up?: string;
  down?: string;
}) {
  const { s } = scaleFor(bars, { slots, prices, W, H, pad, right });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={label} preserveAspectRatio="none">
      {bars.map((b, i) => {
        const up = b[4] >= b[1];
        const top = s.y(Math.max(b[1], b[4]));
        const bot = s.y(Math.min(b[1], b[4]));
        return (
          <g key={b[0]} className={candleClass?.(i)} fill={up ? upColor : downColor} stroke={up ? upColor : downColor}>
            <line x1={s.x(i)} x2={s.x(i)} y1={s.y(b[2])} y2={s.y(b[3])} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <rect x={s.x(i) - s.w * 0.32} width={s.w * 0.64} y={top} height={Math.max(1, bot - top)} stroke="none" />
          </g>
        );
      })}
      {children?.(s)}
    </svg>
  );
}
