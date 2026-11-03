import Link from "next/link";
import { cn, formatWibTime } from "@/lib/cn";
import type { NewsListItem } from "@/features/news/queries/news";

export function RelatedNewsList({ news }: { news: NewsListItem[] }) {
  if (news.length === 0) {
    return <p className="py-6 text-[14px] text-white/40">No approved news in the two hours around this event.</p>;
  }

  return (
    <ul className="-my-1 divide-y divide-white/[0.07]">
      {news.map((n) => {
        const ts = n.publishedAt ?? n.fetchedAt;
        return (
          <li key={n.id}>
            <Link
              href={`/app/news/${n.id}`}
              className="group flex gap-4 py-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
                  {n.sourceCode}
                  <span className="px-1.5 text-white/20">/</span>
                  {formatWibTime(ts)} WIB
                  {n.impact === "high" && <span className="ml-2 text-brand">High impact</span>}
                </p>
                <h3 className="mt-1 text-[17px] font-medium leading-6 text-white">{n.headline}</h3>
                <p className="mt-1 line-clamp-2 text-[14px] leading-[21px] text-white/55">{n.analysis}</p>
                {n.affects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {n.affects.map((a) => (
                      <span key={a} className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] font-medium text-white/60">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {n.bias !== "neutral" && (
                <span className={cn("hidden shrink-0 self-center text-[12px] font-semibold uppercase tracking-[0.06em] sm:block", n.bias === "bullish" ? "text-up" : "text-down")}>
                  {n.bias === "bullish" ? "▲ Bull" : "▼ Bear"}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
