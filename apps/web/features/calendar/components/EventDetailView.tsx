import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { BiasBadge } from "@/components/ui/Marker";
import { cn, formatWibTime } from "@/lib/cn";
import type { Impact } from "@/features/calendar/types";
import type { TimelineEvent } from "@/features/timeline/types";
import type { NewsListItem } from "@/features/news/queries/news";
import type { MarketQuote, Reaction, Release } from "@/features/calendar/queries/context";
import { RelatedNewsList } from "@/features/calendar/components/RelatedNewsList";
import { Countdown, ImpactBars } from "@/features/calendar/components/EventBits";
import { IMPACT_LABEL } from "@/features/calendar/lib/style";
import { eventLabel, num, surpriseText, surpriseTone, whyItMatters } from "@/features/calendar/lib/econ";

const TONE = { up: "text-up", down: "text-down" } as const;
const DOT = { up: "bg-up", down: "bg-down" } as const;

const dp = (v: number) => (Math.abs(v) >= 1000 ? 2 : Math.abs(v) >= 50 ? 3 : 5);
const price = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: dp(v), maximumFractionDigits: dp(v) });
const pct = (v: number) => `${v > 0 ? "+" : v < 0 ? "-" : ""}${Math.abs(v).toFixed(2)}%`;
const flat = (s: string) => s.replace("/", "");
const day = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Jakarta", ...opts }).replace("Sept", "Sep");

function Tile({ label, value, tone, children }: { label: string; value?: string | null; tone?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.03] px-4 py-3">
      <div className="text-[12px] text-white/45">{label}</div>
      {children || (
        <div className={cn("mt-1 font-num text-[32px] font-semibold leading-9 sm:text-[38px] sm:leading-[42px]", value ? tone ?? "text-white" : "text-white/20")}>
          {value ?? "-"}
        </div>
      )}
    </div>
  );
}

/** Small line of closes; `mark` is the index of the release bar. */
function Spark({ values, mark, className }: { values: number[]; mark?: number; className?: string }) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const y = (v: number) => (hi === lo ? 50 : 92 - ((v - lo) / (hi - lo)) * 84);
  const x = (i: number) => (i / (values.length - 1)) * 100;
  const up = values.at(-1)! >= values[0]!;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className} aria-hidden>
      {mark !== undefined && <line x1={x(mark)} x2={x(mark)} y1="0" y2="100" className="stroke-brand/70" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
      <polyline
        points={values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
        fill="none"
        className={up ? "stroke-up" : "stroke-down"}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

type Point = Release & { current?: boolean };

/**
 * Past releases as a dot (actual) against a tick (forecast), joined by a stem the length of the
 * surprise. Columns are independent, so a phone simply drops the oldest ones.
 */
function HistoryChart({ points, name }: { points: Point[]; name: string }) {
  const vals = points.flatMap((p) => [num(p.actual), num(p.forecast)]).filter((v): v is number => v !== null);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = (hi - lo || Math.abs(hi) || 1) * 0.15;
  const y = (v: number) => ((v - (lo - pad)) / (hi - lo + 2 * pad)) * 100;
  return (
    <div>
      <div className="flex h-44 gap-1 border-b border-white/[0.07]">
        {points.map((p, i) => {
          const a = num(p.actual);
          const f = num(p.forecast);
          const tone = surpriseTone(name, p.actual, p.forecast);
          const hideOnPhone = i < points.length - 6;
          return (
            <div key={p.ts} className={cn("relative flex-1", hideOnPhone && "hidden sm:block", p.current && "rounded-t-lg bg-brand/[0.05]")}>
              {a !== null && f !== null && (
                <span
                  className={cn("absolute left-1/2 w-px -translate-x-1/2", tone ? DOT[tone] : "bg-white/30")}
                  style={{ bottom: `${Math.min(y(a), y(f))}%`, height: `${Math.abs(y(a) - y(f))}%` }}
                />
              )}
              {f !== null && (
                <span className="absolute left-1/2 h-0.5 w-5 -translate-x-1/2 translate-y-1/2 rounded bg-white/40" style={{ bottom: `${y(f)}%` }} title={`Forecast ${p.forecast}`} />
              )}
              {a !== null && (
                <>
                  <span
                    className={cn(
                      "absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full",
                      tone ? DOT[tone] : "bg-white",
                      p.current && "ring-2 ring-brand ring-offset-2 ring-offset-panel",
                    )}
                    style={{ bottom: `${y(a)}%` }}
                  />
                  <span
                    className={cn("absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-num text-[13px] font-semibold", tone ? TONE[tone] : "text-white/80")}
                    style={{ bottom: `calc(${Math.max(y(a), f === null ? y(a) : y(f))}% + 8px)` }}
                  >
                    {p.actual}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1">
        {points.map((p, i) => (
          <div key={p.ts} className={cn("flex-1 text-center text-[11px] leading-4", i < points.length - 6 && "hidden sm:block", p.current ? "text-brand" : "text-white/40")}>
            {p.current ? "This" : day(p.ts, { month: "short" })}
            <span className="block text-white/25">{p.forecast ? `F ${p.forecast}` : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EventDetailView({
  event,
  news,
  history,
  markets,
  reaction,
}: {
  event: TimelineEvent;
  news: NewsListItem[];
  history: Release[];
  markets: MarketQuote[];
  reaction: Reaction | null;
}) {
  const meta = (event.metadata ?? {}) as Record<string, string | undefined>;
  const { cur, flag, name } = eventLabel(event.title, event.symbols[0] ?? "");
  const actual = meta.actual || undefined;
  const forecast = meta.forecast || meta.consensus || undefined;
  const previous = meta.previous || undefined;
  const tone = surpriseTone(name, actual, forecast);
  const surprise = surpriseText(actual, forecast);
  const impact = (event.impact ?? "low") as Impact;
  const upcoming = new Date(event.occurredAt).getTime() > Date.now();

  const points: Point[] = [...history, ...(actual || forecast ? [{ ts: event.occurredAt, actual: actual ?? "", forecast, current: true }] : [])];
  const scored = history.filter((h) => num(h.actual) !== null && num(h.forecast) !== null);
  const beats = scored.filter((h) => surpriseTone(name, h.actual, h.forecast) === "up").length;

  return (
    <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        <section className="rounded-2xl bg-panel p-5 sm:p-8">
          <Link href="/app/calendar" className="text-[13px] text-white/40 hover:text-white">
            ← Calendar
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <span aria-hidden className="text-[18px] leading-none">{flag}</span>
              {cur}
            </span>
            <span className={cn("flex items-center gap-1.5 font-medium", impact === "high" ? "text-brand" : "text-white/55")}>
              <ImpactBars impact={impact} />
              {IMPACT_LABEL[impact]} impact
            </span>
          </div>
          <h1 className="mt-2 text-balance font-num text-[34px] font-semibold leading-[38px] text-white sm:text-[44px] sm:leading-[46px]">{name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[14px] text-white/55">
            <span>
              {day(event.occurredAt, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}, {formatWibTime(event.occurredAt)} WIB
            </span>
            {!upcoming && (
              <>
                <span className="text-white/20">·</span>
                <Countdown ts={event.occurredAt} pastPrefix="Released " />
              </>
            )}
          </p>
          {event.bias && event.bias !== "neutral" && (
            <div className="mt-3">
              <BiasBadge bias={event.bias} />
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile label={upcoming ? "Releases" : "Actual"} value={actual} tone={tone ? TONE[tone] : undefined}>
              {!actual && (
                <div className="mt-1 whitespace-nowrap font-num text-[26px] font-semibold leading-9 text-brand sm:text-[30px] sm:leading-[42px]">
                  {upcoming ? <Countdown ts={event.occurredAt} /> : "-"}
                </div>
              )}
            </Tile>
            <Tile label="Forecast" value={forecast} tone="text-white/80" />
            <Tile label="Previous" value={previous} tone="text-white/60" />
            <Tile label="Surprise" value={surprise} tone={tone ? TONE[tone] : "text-white/60"}>
              {!surprise && <div className="mt-1 pt-2 text-[13px] leading-5 text-white/35">Once it prints</div>}
            </Tile>
          </div>
          {tone && (
            <p className="mt-3 text-[13px] text-white/55">
              {tone === "up" ? "Better" : "Worse"} than forecast for {cur === "Other" ? "the currency" : cur}
              {/unemployment|jobless|claims/i.test(name) && ", where a lower print is the better one"}.
            </p>
          )}
        </section>

        <Panel title="Why it matters">
          <p className="max-w-[68ch] text-[15px] leading-[24px] text-white/80">{whyItMatters(name)}</p>
          {event.body && (
            <blockquote className="mt-4 max-w-[68ch] border-l-2 border-brand pl-4 text-[15px] leading-[24px] text-white">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">Desk note</span>
              {event.body}
            </blockquote>
          )}
        </Panel>

        {points.length >= 3 && (
          <Panel
            title="History"
            sub={scored.length ? `Beat the forecast in ${beats} of the last ${scored.length} releases` : "Past releases"}
            action={
              <span className="flex items-center gap-3 text-[12px] text-white/45">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white" />Actual</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-white/40" />Forecast</span>
              </span>
            }
          >
            <HistoryChart points={points} name={name} />
          </Panel>
        )}

        <Panel title="Related news" sub={`${news.length} ${news.length === 1 ? "item" : "items"} within two hours of the release`}>
          <RelatedNewsList news={news} />
        </Panel>
      </div>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
        {reaction && (
          <Panel
            title="Price reaction"
            sub={`${reaction.symbol} around the ${reaction.which === "this" ? "release" : "last release"}, ${day(reaction.at, { day: "numeric", month: "short" })} ${formatWibTime(reaction.at)}`}
          >
            <Spark
              values={reaction.closes.map((c) => c.close)}
              mark={reaction.closes.findLastIndex((c) => c.ts <= reaction.at)}
              className="h-20 w-full"
            />
            <dl className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
              {[
                ["First hour", pct((reaction.after1h / reaction.base - 1) * 100), reaction.after1h - reaction.base],
                ["After 4h", reaction.after4h === null ? "-" : pct((reaction.after4h / reaction.base - 1) * 100), (reaction.after4h ?? reaction.base) - reaction.base],
                ["4h range", pct((reaction.high / reaction.low - 1) * 100), 0],
              ].map(([k, v, d]) => (
                <div key={k as string}>
                  <dt className="text-white/40">{k}</dt>
                  <dd className={cn("font-num text-[20px] font-semibold", (d as number) > 0 ? "text-up" : (d as number) < 0 ? "text-down" : "text-white")}>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[12px] text-white/35">From {price(reaction.base)}, hourly candles.</p>
          </Panel>
        )}

        {markets.length > 0 && (
          <Panel title="Related markets" sub="Last price and 24h change">
            <ul className="-my-1 divide-y divide-white/[0.07]">
              {markets.map((m) => (
                <li key={m.symbol}>
                  <Link
                    href={`/app/instrument/${flat(m.symbol)}`}
                    className="group grid grid-cols-[minmax(0,1fr)_64px_auto] items-center gap-3 py-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                  >
                    <span className="text-[14px] font-medium text-white group-hover:text-brand">{m.symbol}</span>
                    <Spark values={m.spark} className="h-6 w-16" />
                    <span className="text-right">
                      <span className="block font-num text-[17px] font-semibold leading-5 text-white">{price(m.price)}</span>
                      <span className={cn("text-[12px] tabular-nums", m.change > 0 ? "text-up" : m.change < 0 ? "text-down" : "text-white/40")}>{pct(m.change)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </aside>
    </div>
  );
}
