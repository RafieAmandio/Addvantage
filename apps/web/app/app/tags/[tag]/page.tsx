import Link from "next/link";
import { notFound } from "next/navigation";
import { HASHTAGS, type Hashtag } from "@tradevantage/shared";
import { getHashtagMeta } from "@/features/tags/constants";
import { listNewsByTag, listPrimersByTag } from "@/features/tags/queries";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
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

  return (
    <div className="stagger bg-grid-fine">
      <div className="border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <Link
            href="/app/tags"
            className="font-mono text-[10px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            ← All hashtags
          </Link>
          <DataLabel className="mt-6">Hashtag · cross-cut</DataLabel>
          <h1 className="mt-2 font-display text-6xl leading-none text-white">
            <span className="text-brand">#</span>
            {tag}
          </h1>
          <div className="mt-2 font-mono text-xs italic uppercase tracking-widest2 text-brand/80">
            {meta.label}
          </div>
          <p className="mt-3 max-w-2xl text-white/70">{meta.description}</p>
          <div className="mt-4 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            {total} TOTAL ITEMS · {matchedPrimers.length} PRIMERS ·{" "}
            {matchedNews.length} NEWS
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {matchedPrimers.length > 0 && (
          <Group n="01 /" label="PRIMERS">
            <div className="grid grid-cols-1 gap-px bg-gray-3 sm:grid-cols-2 lg:grid-cols-3">
              {matchedPrimers.map((p) => (
                <Link
                  key={p.id}
                  href={`/app/education/${p.id}`}
                  className="bg-black p-5 transition-colors hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                >
                  <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                    {p.id}
                  </div>
                  <div className="mt-2 font-display text-xl text-white">
                    {p.title}
                  </div>
                  <div className="mt-1 font-mono text-[10px] italic text-brand/60">
                    {p.framework}
                  </div>
                  <p className="mt-3 text-sm text-white/60">{p.summary}</p>
                </Link>
              ))}
            </div>
          </Group>
        )}

        {matchedNews.length > 0 && (
          <Group n="02 /" label="NEWS">
            <div className="space-y-px bg-gray-3">
              {matchedNews.map((n) => (
                <Link
                  key={n.id}
                  href={`/app/news/${n.id}`}
                  className="block bg-black p-4 transition-colors hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                >
                  <div className="flex items-baseline justify-between">
                    <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                      [{n.sourceCode}]
                    </div>
                    {n.publishedAt && (
                      <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                        {formatDate(n.publishedAt)}
                      </div>
                    )}
                  </div>
                  <div className="mt-1 font-display text-lg text-white">
                    {n.headline}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-white/60">
                    {n.analysis}
                  </p>
                </Link>
              ))}
            </div>
          </Group>
        )}

        {total === 0 && (
          <div className="border border-gray-3 bg-gray-2/30 p-12 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              ● EMPTY CROSS-CUT
            </div>
            <div className="mt-3 font-display text-2xl text-white">
              Nothing tagged #{tag} yet.
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              This tag will populate as news and primers are published.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/app/tags"
                className="border border-brand/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-brand transition-colors hover:bg-brand hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                ← All hashtags
              </Link>
              <Link
                href="/app/news"
                className="border border-gray-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-white/40 hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                Browse news →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Group({
  n,
  label,
  children,
}: {
  n: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <SectionNumber n={n} label={label} />
      <div className="mt-4">{children}</div>
    </section>
  );
}
