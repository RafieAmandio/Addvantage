import type { IChartApi, IPrimitivePaneRenderer, IPrimitivePaneView, ISeriesApi, ISeriesPrimitive, SeriesAttachedParameter, Time } from "lightweight-charts";

/** Shaded rectangle between two bar indexes (logical, so it can run past the last candle) and two prices. */
export interface Box {
  i0: number;
  i1: number;
  top: number;
  bottom: number;
  fill: string;
  stroke?: string;
  dashed?: boolean;
  label?: string;
  labelColor?: string;
}

type Target = Parameters<IPrimitivePaneRenderer["draw"]>[0];

/** lightweight-charts only draws lines and markers; this paints zones, the ATR band and the R/R box behind the candles. */
export class BoxPrimitive implements ISeriesPrimitive<Time> {
  private chart: IChartApi | null = null;
  private series: ISeriesApi<"Candlestick"> | null = null;
  private request: (() => void) | null = null;
  private times: Time[] = [];
  constructor(private boxes: Box[]) {}

  /** `times` are the series' bar times, used to place bar indexes on the time axis. */
  set(boxes: Box[], times: Time[]) {
    this.boxes = boxes;
    this.times = times;
    this.request?.();
  }

  attached(p: SeriesAttachedParameter<Time>) {
    this.chart = p.chart as IChartApi;
    this.series = p.series as ISeriesApi<"Candlestick">;
    this.request = p.requestUpdate;
  }

  detached() {
    this.chart = this.series = this.request = null;
  }

  paneViews(): IPrimitivePaneView[] {
    return [{ zOrder: () => "bottom", renderer: () => ({ draw: (t: Target) => this.draw(t) }) }];
  }

  /** X of a bar index; indexes past the last bar extend by the bar spacing into the right margin. */
  private x(i: number, half: number): number | null {
    const ts = this.chart!.timeScale();
    const last = this.times.length - 1;
    const space = ts.options().barSpacing;
    const k = Math.max(0, Math.min(i, last));
    const base = this.times[k] !== undefined ? ts.timeToCoordinate(this.times[k]!) : null;
    return base === null ? null : base + (i - k + half) * space;
  }

  private draw(target: Target) {
    const ts = this.chart?.timeScale();
    const s = this.series;
    if (!ts || !s) return;
    target.useBitmapCoordinateSpace(({ context: c, horizontalPixelRatio: hr, verticalPixelRatio: vr }) => {
      for (const b of this.boxes) {
        const x0 = this.x(b.i0, -0.5);
        const x1 = this.x(b.i1, 0.5);
        const y0 = s.priceToCoordinate(b.top);
        const y1 = s.priceToCoordinate(b.bottom);
        if (x0 === null || x1 === null || y0 === null || y1 === null) continue;
        const x = Math.round(x0 * hr);
        const y = Math.round(Math.min(y0, y1) * vr);
        const w = Math.max(1, Math.round((x1 - x0) * hr));
        const h = Math.max(1, Math.round(Math.abs(y1 - y0) * vr));
        c.fillStyle = b.fill;
        c.fillRect(x, y, w, h);
        if (b.stroke) {
          c.strokeStyle = b.stroke;
          c.lineWidth = Math.max(1, hr);
          c.setLineDash(b.dashed ? [4 * hr, 4 * hr] : []);
          c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        }
        if (b.label) {
          c.font = `600 ${11 * vr}px Geist, sans-serif`;
          c.fillStyle = b.labelColor ?? "rgba(255,255,255,.75)";
          c.textBaseline = "top";
          // Right-aligned so labels sit in the empty space past the last candle, not over price.
          c.textAlign = "right";
          c.fillText(b.label, x + w - 4 * hr, y + 3 * vr);
          c.textAlign = "left";
        }
      }
    });
  }
}
