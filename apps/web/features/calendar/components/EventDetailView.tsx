import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { BiasBadge } from "@/components/ui/Marker";
import { cn, formatDate, formatWibTime } from "@/lib/cn";
import type { TimelineEvent } from "@/features/timeline/types";
import type { NewsListItem } from "@/features/news/queries/news";
import { RelatedNewsList } from "@/features/calendar/components/RelatedNewsList";

const FIGURES = [
  { key: "actual", label: "Actual" },
  { key: "forecast", label: "Forecast" },
  { key: "consensus", label: "Consensus" },
  { key: "previous", label: "Previous" },
] as const;

export function EventDetailView({
  event,
  news,
}: {
  event: TimelineEvent;
  news: NewsListItem[];
}) {
  const meta = (event.metadata ?? {}) as Record<string, string | undefined>;
  const figures = FIGURES.filter((f) => meta[f.key]);
  const [prefix, ...rest] = event.title.split(" — ");
  const name = rest.length ? rest.join(" — ") : event.title;
  return (
    <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        <section className="rounded-2xl bg-panel p-5 sm:p-8">
          <Link href="/app/calendar" className="text-[13px] text-white/40 hover:text-white">
            ← Calendar
          </Link>
          <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
            {rest.length ? prefix : event.kind}
            <span className="px-1.5 text-white/20">/</span>
            {formatDate(event.occurredAt)} · {formatWibTime(event.occurredAt)} WIB
            {event.impact && (
              <span className={cn("ml-2", event.impact === "high" ? "text-brand" : "text-white/55")}>
                {event.impact === "high" ? "High impact" : `${event.impact} impact`}
              </span>
            )}
          </p>
          <h1 className="mt-2 text-balance font-num text-[34px] font-semibold leading-[38px] text-white sm:text-[44px] sm:leading-[46px]">
            {name}
          </h1>
          {event.bias && event.bias !== "neutral" && (
            <div className="mt-3">
              <BiasBadge bias={event.bias} />
            </div>
          )}
          {event.body && <p className="mt-6 max-w-[68ch] text-[17px] leading-[28px] text-white/85">{event.body}</p>}
        </section>

        <Panel title="Related news" sub={`${news.length} ${news.length === 1 ? "item" : "items"} within two hours of the release`}>
          <RelatedNewsList news={news} />
        </Panel>
      </div>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel title="Figures">
          {figures.length === 0 ? (
            <p className="text-[14px] text-white/40">No figures published for this event yet.</p>
          ) : (
            <ul className="-my-1 divide-y divide-white/[0.07]">
              {figures.map((f) => (
                <li key={f.key} className="flex items-baseline justify-between gap-3 py-2.5">
                  <span className="text-[14px] text-white/55">{f.label}</span>
                  <span className={cn("font-num font-semibold", f.key === "actual" ? "text-[32px] leading-9 text-white" : "text-[22px] leading-6 text-white/75")}>
                    {meta[f.key]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {event.symbols.length > 0 && (
          <Panel title="Affects">
            <div className="flex flex-wrap gap-1.5">
              {event.symbols.map((s) => (
                <span key={s} className="rounded-full border border-white/[0.12] px-2.5 py-0.5 text-[12px] text-white/70">
                  {s}
                </span>
              ))}
            </div>
          </Panel>
        )}
      </aside>
    </div>
  );
}
