import Link from "next/link";
import { notFound } from "next/navigation";
import { HASHTAGS, type Hashtag } from "@tradevantage/shared";
import { getHashtagMeta } from "@/features/tags/constants";
import { listNewsByTag, listPrimersByTag } from "@/features/tags/queries";
import { BiasBadge } from "@/components/ui/Marker";
import { Panel, PanelLink } from "@/components/ui/Panel";
import { formatDate } from "@/lib/cn";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isHashtag(s: string): s is Hashtag {
  return (HASHTAGS as readonly string[]).includes(s);
}

export default async function TagPage({
  params,
}: {
  params: { tag: string };
}) {
  const { tag: rawTag } = params;
  if (!isHashtag(rawTag)) return notFound();
  const tag = rawTag;
  const meta = getHashtagMeta(tag);

  const [matchedNews, matchedPrimers] = await Promise.all([
    listNewsByTag(tag),
    listPrimersByTag(tag),
  ]);

  const total = matchedPrimers.length + matchedNews.length;

  const EYEBROW = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";

  return (
    <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        <Panel title={`News · ${matchedNews.length}`} action={<PanelLink href="/app/news">All news</PanelLink>}>
          {matchedNews.length === 0 ? (
            <p className="text-[14px] text-white/55">No news tagged #{tag} yet. This fills in as items are published.</p>
          ) : (
            <ul className="-my-3 divide-y divide-white/[0.07]">
              {matchedNews.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/app/news/${n.id}`}
                    className="group flex gap-4 py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                  >
                    <div className="min-w-0 flex-1">
                      <p className={EYEBROW}>
                        {n.sourceCode}
                        {n.publishedAt && (
                          <>
                            <span className="px-1.5 text-white/20">/</span>
                            {formatDate(n.publishedAt)}
                          </>
                        )}
                        {n.impact === "high" && <span className="ml-2 text-brand">High impact</span>}
                      </p>
                      <p className="mt-0.5 text-[16px] font-medium leading-6 text-white">{n.headline}</p>
                      <p className="mt-0.5 line-clamp-2 text-[14px] leading-[21px] text-white/55">{n.analysis}</p>
                    </div>
                    {n.bias !== "neutral" && (
                      <span className="hidden shrink-0 self-center sm:block">
                        <BiasBadge bias={n.bias} />
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel action={<PanelLink href="/app/tags">All tags</PanelLink>} title={meta.label}>
          <p className="font-num text-[40px] font-semibold leading-[44px] text-white">
            <span className="text-white/30">#</span>
            {tag}
          </p>
          <p className="mt-2 text-[14px] leading-[21px] text-white/55">{meta.description}</p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              ["Total", total],
              ["News", matchedNews.length],
              ["Primers", matchedPrimers.length],
            ].map(([label, v]) => (
              <div key={label}>
                <p className={EYEBROW}>{label}</p>
                <p className="font-num text-[28px] font-semibold leading-8 text-white">{v}</p>
              </div>
            ))}
          </div>
        </Panel>

        {matchedPrimers.length > 0 && (
          <Panel title={`Primers · ${matchedPrimers.length}`}>
            <ul className="-my-2.5 divide-y divide-white/[0.07]">
              {matchedPrimers.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/app/education/${p.id}`}
                    className="group block py-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                  >
                    <p className="text-[15px] font-semibold text-white group-hover:text-brand">{p.title}</p>
                    <p className="text-[12px] text-white/40">{p.framework}</p>
                    <p className="mt-0.5 line-clamp-2 text-[13px] leading-[19px] text-white/55">{p.summary}</p>
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
