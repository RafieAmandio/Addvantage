import type { Metadata } from "next";
import Link from "next/link";
import { listFilteredNews } from "@/features/news/queries/news";
import { cn, formatDateTime } from "@/lib/cn";
import { SOURCE_CODES } from "@tradevantage/shared";
import { IMPACT_LEVELS, BIAS_LEVELS, HASHTAGS } from "@tradevantage/shared";
import { ReviewActions } from "./ReviewActions";
import { Panel } from "@/components/ui/Panel";
import { SegmentedNav } from "@/components/ui/SegmentedNav";
import { BiasBadge, ImpactPill } from "@/components/ui/Marker";

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

  const pagerClass =
    "rounded-full border border-white/[0.14] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Panel
        title="Review queue"
        className="lg:self-start"
        sub={`${total} ${status}`}
        action={
          <Link
            href="/admin/review/new"
            className="inline-flex h-9 items-center rounded-full bg-brand px-4 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            New item
          </Link>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedNav
            items={STATUSES}
            current={status as (typeof STATUSES)[number]}
            hrefFor={(s) => buildUrl({ status: s, page: "1" })}
            labelFor={(s) => s[0].toUpperCase() + s.slice(1)}
            ariaLabel="Status"
          />
          <SegmentedNav
            items={["desc", "asc"] as const}
            current={sort}
            hrefFor={(s) => buildUrl({ sort: s, page: "1" })}
            labelFor={(s) => (s === "desc" ? "Newest" : "Oldest")}
            ariaLabel="Sort"
          />
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-xl bg-raised px-5 py-12 text-center">
            <p className="text-[15px] font-medium text-white">
              {activeFilterCount > 0
                ? "No items match these filters."
                : status === "pending"
                  ? "Nothing waiting for review."
                  : `No ${status} items.`}
            </p>
            <p className="mt-1 text-[13px] text-white/55">
              {activeFilterCount > 0
                ? "Remove a filter or clear them all."
                : "New items from the pipeline land here."}
            </p>
            {activeFilterCount > 0 && (
              <Link
                href={clearAllUrl}
                className="mt-5 inline-flex h-9 items-center rounded-full bg-brand px-4 text-[13px] font-semibold text-black transition-opacity hover:opacity-90"
              >
                Clear all filters
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <div className="hidden grid-cols-[minmax(0,1fr)_96px_72px_72px_204px] gap-4 border-b border-white/[0.07] pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40 xl:grid">
              <span>Headline</span>
              <span>Impact</span>
              <span>Bias</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            <ul className="divide-y divide-white/[0.07]">
              {items.map((n) => (
                <li
                  key={n.id}
                  className="group relative grid gap-x-4 gap-y-2 py-3.5 xl:grid-cols-[minmax(0,1fr)_96px_72px_72px_204px] xl:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
                      {n.sourceCode}
                      <span className="px-1.5 text-white/20">/</span>
                      <span className="font-medium normal-case tracking-normal">
                        {formatDateTime(n.fetchedAt)}
                      </span>
                    </p>
                    <Link
                      href={`/admin/review/${n.id}`}
                      className="mt-0.5 block text-[15px] font-medium leading-[21px] text-white after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand group-hover:text-brand"
                    >
                      {n.headline}
                    </Link>
                    <p className="mt-0.5 line-clamp-1 text-[13px] leading-[19px] text-white/55">
                      {n.analysis}
                    </p>
                    {(n.affects.length > 0 || n.tags.length > 0) && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {n.affects.slice(0, 6).map((a: string) => (
                          <span
                            key={a}
                            className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] font-medium text-white/60"
                          >
                            {a}
                          </span>
                        ))}
                        {n.tags.map((t: string) => (
                          <span key={t} className="px-0.5 py-px text-[11px] text-white/35">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 xl:contents">
                    <span><ImpactPill level={n.impact as React.ComponentProps<typeof ImpactPill>["level"]} /></span>
                    <span><BiasBadge bias={n.bias as React.ComponentProps<typeof BiasBadge>["bias"]} /></span>
                    <span className={cn("text-[13px] font-medium capitalize", statusColor(n.status))}>
                      {n.status}
                    </span>
                    <div className="relative z-10 ml-auto flex items-center justify-end gap-1.5">
                      <ReviewActions id={n.id} status={n.status} />
                      <Link
                        href={`/admin/review/${n.id}`}
                        className="inline-flex h-8 items-center rounded-full border border-white/[0.14] px-3 text-[12px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
            <span className="text-[13px] text-white/40">
              Page <span className="font-num text-[15px] font-semibold text-white/70">{page}</span> of{" "}
              <span className="font-num text-[15px] font-semibold text-white/70">{totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })} className={pagerClass}>
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={buildUrl({ page: String(page + 1) })} className={pagerClass}>
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </Panel>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <Panel
          title="Filters"
          sub={activeFilterCount > 0 ? `${activeFilterCount} active` : "Showing everything"}
          action={
            activeFilterCount > 0 ? (
              <Link
                href={clearAllUrl}
                className="rounded-full px-2.5 py-1 text-[13px] font-medium text-white/55 transition-colors hover:bg-raised hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                Clear all
              </Link>
            ) : undefined
          }
        >
          <div className="space-y-4">
            <FilterRow label="Source" group="source" current={sources} allValues={[...SOURCE_CODES]} buildToggle={toggleUrl} buildClear={() => buildUrl({ source: undefined, page: "1" })} />
            <FilterRow label="Impact" group="impact" current={impacts} allValues={[...IMPACT_LEVELS]} buildToggle={toggleUrl} buildClear={() => buildUrl({ impact: undefined, page: "1" })} />
            <FilterRow label="Bias" group="bias" current={biases} allValues={[...BIAS_LEVELS]} buildToggle={toggleUrl} buildClear={() => buildUrl({ bias: undefined, page: "1" })} />
            <FilterRow label="Tags" group="tags" current={tags} allValues={[...HASHTAGS]} buildToggle={toggleUrl} buildClear={() => buildUrl({ tags: undefined, page: "1" })} prefix="#" />
          </div>
        </Panel>
      </aside>
    </div>
  );
}

function statusColor(status: string) {
  return status === "approved" ? "text-up" : status === "rejected" ? "text-down" : "text-white/55";
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
    <div>
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        <Chip href={buildClear()} active={current.length === 0}>
          All
        </Chip>
        {allValues.map((v) => (
          <Chip key={v} href={buildToggle(group, current, v)} active={current.includes(v)}>
            {prefix ?? ""}
            {v}
          </Chip>
        ))}
      </div>
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
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
        active
          ? "border-brand bg-brand text-black"
          : "border-white/[0.12] text-white/60 hover:bg-raised hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}
