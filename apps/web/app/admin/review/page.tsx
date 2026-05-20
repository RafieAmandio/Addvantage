import type { Metadata } from "next";
import Link from "next/link";
import { listPendingNews } from "@/features/news/queries/news";
import { formatDateTime } from "@/lib/cn";
import { SOURCE_CODES } from "@tradevantage/shared";

export const metadata: Metadata = { title: "Review Queue" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const PER_PAGE = 20;

export default async function AdminReviewQueuePage({
  searchParams,
}: {
  searchParams?: { page?: string; source?: string; sort?: string };
}) {
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const source = searchParams?.source || undefined;
  const sort = searchParams?.sort === "asc" ? "asc" as const : "desc" as const;

  const { items, total } = await listPendingNews({
    page,
    limit: PER_PAGE,
    source,
    sort,
  });

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { page: String(page), source, sort, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all" && !(k === "page" && v === "1") && !(k === "sort" && v === "desc")) {
        params.set(k, v);
      }
    }
    const qs = params.toString();
    return `/admin/review${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            Inbound · Pending Review
          </span>
          <h1 className="mt-2 font-mono text-2xl font-bold text-white">
            Review Queue
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
            {total} pending
          </span>
          <Link
            href="/admin/review/new"
            className="bg-brand px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-brand-dim hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            + New item
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
          Source
        </span>
        <Chip href={buildUrl({ source: undefined, page: "1" })} active={!source}>All</Chip>
        {SOURCE_CODES.map((code) => (
          <Chip key={code} href={buildUrl({ source: code, page: "1" })} active={source === code}>{code}</Chip>
        ))}

        <div className="mx-2 h-4 w-px bg-white/10" />

        <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
          Sort
        </span>
        <Chip href={buildUrl({ sort: "desc", page: "1" })} active={sort === "desc"}>Newest</Chip>
        <Chip href={buildUrl({ sort: "asc", page: "1" })} active={sort === "asc"}>Oldest</Chip>
      </div>

      <div className="mt-4 h-px bg-white/20" />

      {items.length === 0 && (
        <div className="py-20 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-moss">
            {source ? `No pending items from [${source}]` : "● Inbox Clear"}
          </div>
          <div className="mt-4 font-mono text-xl font-bold text-white">
            {source ? "Try a different source filter." : "No items pending review."}
          </div>
          {!source && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-white/30">
              New items appear here after the worker ingests and rephrases a
              source.
            </p>
          )}
          <div className="mt-8 flex items-center justify-center gap-3">
            {source && (
              <Link
                href="/admin/review"
                className="bg-brand px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-brand-dim hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                Clear filter
              </Link>
            )}
            <Link
              href="/admin/logs"
              className="border border-white/20 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Pipeline logs →
            </Link>
          </div>
        </div>
      )}

      <div className="mt-px">
        {items.map((n, i) => (
          <Link
            key={n.id}
            href={`/admin/review/${n.id}`}
            className="group grid grid-cols-12 gap-4 border-b border-white/[0.08] py-6 transition-all hover:bg-white/[0.02] focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none sm:gap-6"
          >
            <div className="col-span-12 lg:col-span-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] tabular-nums text-white/20">
                  {String((page - 1) * PER_PAGE + i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                  [{n.sourceCode}]
                </span>
              </div>
              <div className="mt-2 pl-7 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
                {formatDateTime(n.fetchedAt)}
              </div>
              <div className="mt-2 flex gap-2 pl-7 font-mono text-[9px] uppercase tracking-widest2">
                <span className="text-brand">{n.impact}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/50">{n.bias}</span>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-10">
              <div className="font-mono text-lg font-bold text-white transition-colors group-hover:text-brand">
                {n.headline}
              </div>
              <p className="mt-2 line-clamp-2 font-mono text-sm font-light leading-relaxed text-white/60">
                {n.analysis}
              </p>
              {(n.affects.length > 0 || n.tags.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {n.affects.slice(0, 6).map((a: string) => (
                    <span
                      key={a}
                      className="border border-white/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/50"
                    >
                      {a}
                    </span>
                  ))}
                  {n.tags.map((t: string) => (
                    <span
                      key={t}
                      className="border border-brand/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-brand/70"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
            Page {page} of {totalPages} · {total} items
          </span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="border border-white/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="border border-white/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`border px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 transition-colors focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none ${
        active
          ? "border-brand bg-brand/10 text-brand"
          : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/60"
      }`}
    >
      {children}
    </Link>
  );
}
