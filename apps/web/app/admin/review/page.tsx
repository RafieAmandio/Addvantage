import type { Metadata } from "next";
import Link from "next/link";
import { listFilteredNews } from "@/features/news/queries/news";
import { formatDateTime } from "@/lib/cn";
import { SOURCE_CODES } from "@tradevantage/shared";
import { IMPACT_LEVELS, BIAS_LEVELS, HASHTAGS } from "@tradevantage/shared";

export const metadata: Metadata = { title: "Review Queue" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const PER_PAGE = 20;
const STATUSES = ["pending", "approved", "rejected"] as const;

function parseMulti(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").filter(Boolean);
}

function toggleValue(current: string[], value: string): string[] {
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
}

export default async function AdminReviewQueuePage({
  searchParams,
}: {
  searchParams?: {
    page?: string;
    source?: string;
    impact?: string;
    bias?: string;
    tags?: string;
    status?: string;
    sort?: string;
  };
}) {
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const sources = parseMulti(searchParams?.source);
  const impacts = parseMulti(searchParams?.impact);
  const biases = parseMulti(searchParams?.bias);
  const tags = parseMulti(searchParams?.tags);
  const status = searchParams?.status || "pending";
  const sort = searchParams?.sort === "asc" ? ("asc" as const) : ("desc" as const);

  const { items, total } = await listFilteredNews({
    page,
    limit: PER_PAGE,
    source: sources.length ? sources.join(",") : undefined,
    impact: impacts.length ? impacts.join(",") : undefined,
    bias: biases.length ? biases.join(",") : undefined,
    tags: tags.length ? tags.join(",") : undefined,
    status,
    sort,
  });

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      page: String(page),
      source: sources.join(",") || undefined,
      impact: impacts.join(",") || undefined,
      bias: biases.join(",") || undefined,
      tags: tags.join(",") || undefined,
      status,
      sort,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (
        v &&
        !(k === "page" && v === "1") &&
        !(k === "sort" && v === "desc") &&
        !(k === "status" && v === "pending")
      ) {
        params.set(k, v);
      }
    }
    const qs = params.toString();
    return `/admin/review${qs ? `?${qs}` : ""}`;
  }

  function toggleUrl(group: string, current: string[], value: string) {
    const next = toggleValue(current, value);
    return buildUrl({ [group]: next.join(",") || undefined, page: "1" });
  }

  const activeFilterCount =
    sources.length + impacts.length + biases.length + tags.length;

  const clearAllUrl = buildUrl({
    source: undefined, impact: undefined, bias: undefined, tags: undefined, page: "1",
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            Inbound · Review
          </span>
          <h1 className="mt-2 font-mono text-2xl font-bold text-white">
            Review Queue
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
            {total} {status}
          </span>
          <Link
            href="/admin/review/new"
            className="bg-brand px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-brand-dim hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            + New item
          </Link>
        </div>
      </div>

      {/* Status tabs + Sort */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={buildUrl({ status: s, page: "1" })}
              className={`border px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest2 transition-colors focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none ${
                status === s
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/60"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
            Sort
          </span>
          <Chip
            href={buildUrl({ sort: "desc", page: "1" })}
            active={sort === "desc"}
          >
            Newest
          </Chip>
          <Chip
            href={buildUrl({ sort: "asc", page: "1" })}
            active={sort === "asc"}
          >
            Oldest
          </Chip>
        </div>
      </div>

      {/* Multi-select filters */}
      <div className="mt-4 space-y-2 border border-white/[0.06] bg-white/[0.01] p-3">
        <FilterRow label="Source" group="source" current={sources} allValues={[...SOURCE_CODES]} buildToggle={toggleUrl} buildClear={() => buildUrl({ source: undefined, page: "1" })} />
        <FilterRow label="Impact" group="impact" current={impacts} allValues={[...IMPACT_LEVELS]} buildToggle={toggleUrl} buildClear={() => buildUrl({ impact: undefined, page: "1" })} />
        <FilterRow label="Bias" group="bias" current={biases} allValues={[...BIAS_LEVELS]} buildToggle={toggleUrl} buildClear={() => buildUrl({ bias: undefined, page: "1" })} />
        <FilterRow label="Tags" group="tags" current={tags} allValues={[...HASHTAGS]} buildToggle={toggleUrl} buildClear={() => buildUrl({ tags: undefined, page: "1" })} prefix="#" />

        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <Link
              href={clearAllUrl}
              className="border border-blood-bright/40 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-blood-bright transition-colors hover:bg-blood-bright/10 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Clear all filters ({activeFilterCount})
            </Link>
          </div>
        )}
      </div>

      <div className="mt-4 h-px bg-white/20" />

      {items.length === 0 && (
        <div className="py-20 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-moss">
            {activeFilterCount > 0
              ? "No items match filters"
              : `● No ${status} items`}
          </div>
          <div className="mt-4 font-mono text-xl font-bold text-white">
            {activeFilterCount > 0
              ? "Try removing some filters."
              : status === "pending"
                ? "No items pending review."
                : `No ${status} items found.`}
          </div>
          {activeFilterCount > 0 && (
            <div className="mt-8">
              <Link
                href={clearAllUrl}
                className="bg-brand px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-brand-dim hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
              >
                Clear all filters
              </Link>
            </div>
          )}
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
              {status !== "pending" && (
                <div className="mt-2 pl-7 font-mono text-[9px] uppercase tracking-widest2">
                  <span
                    className={
                      n.status === "approved"
                        ? "text-moss"
                        : n.status === "rejected"
                          ? "text-blood-bright"
                          : "text-white/30"
                    }
                  >
                    ● {n.status}
                  </span>
                </div>
              )}
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

function FilterRow({
  label,
  group,
  current,
  allValues,
  buildToggle,
  buildClear,
  prefix,
}: {
  label: string;
  group: string;
  current: string[];
  allValues: string[];
  buildToggle: (group: string, current: string[], value: string) => string;
  buildClear: () => string;
  prefix?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-14 shrink-0 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
        {label}
      </span>
      <Chip href={buildClear()} active={current.length === 0}>
        All
      </Chip>
      {allValues.map((v) => (
        <Chip
          key={v}
          href={buildToggle(group, current, v)}
          active={current.includes(v)}
        >
          {prefix ?? ""}{v}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
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
