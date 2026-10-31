import type { Metadata } from "next";
import { listSources } from "@/features/sources/queries/sources";
import { cn, formatDateTime } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";

export const metadata: Metadata = { title: "Sources" };

export const dynamic = "force-dynamic";
export const revalidate = 0;

const cell =
  "text-[13px] text-white/55 before:block before:text-[11px] before:font-semibold before:uppercase before:tracking-[0.08em] before:text-white/30 before:content-[attr(data-label)] md:py-3 md:pr-4 md:text-[14px] md:before:hidden";
const th = "pb-2 text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";

export default async function AdminSourcesPage() {
  const rows = await listSources();
  const enabled = rows.filter((s) => s.enabled).length;
  const failing = rows.filter((s) => s.lastError).length;

  return (
    <div className="space-y-4">
      <Panel
        title="Source registry"
        sub="Ingestion adapters wired to the pipeline. Enable or disable them in the database; changes apply at the next scheduler tick."
      >
        {rows.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-x-8 gap-y-2">
            <Figure label="Sources" value={rows.length} />
            <Figure label="Enabled" value={enabled} className="text-up" />
            <Figure label="Failing" value={failing} className={failing > 0 ? "text-down" : undefined} />
          </div>
        )}

        {rows.length === 0 ? (
          <div className="rounded-xl bg-raised px-5 py-12 text-center">
            <p className="text-[15px] font-medium text-white">Source registry is empty.</p>
            <p className="mt-1 text-[13px] text-white/55">
              Run the DB migration to seed the sources table, then restart the worker.
            </p>
          </div>
        ) : (
          <table className="block w-full text-[14px] md:table">
              <thead className="hidden border-b border-white/[0.07] md:table-header-group">
                <tr>
                  <th className={th}>Source</th>
                  <th className={th}>Status</th>
                  <th className={th}>Last poll</th>
                  <th className={th}>Last success</th>
                  <th className={cn(th, "text-right")}>Interval</th>
                </tr>
              </thead>
              <tbody className="block divide-y divide-white/[0.07] md:table-row-group">
                {rows.map((s) => (
                  <tr key={s.code} className="grid grid-cols-2 gap-x-4 gap-y-1 py-3 align-top md:table-row md:py-0">
                    <td className="col-span-2 md:py-3 md:pr-4">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{s.code}</p>
                      <p className="mt-0.5 font-medium text-white">{s.name}</p>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 block max-w-[360px] truncate text-[12px] text-white/30 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                      >
                        {s.url}
                      </a>
                      {s.lastError && <p className="mt-1 text-[13px] text-down">{s.lastError}</p>}
                    </td>
                    <td className={cn("col-span-2 text-[13px] font-medium md:py-3 md:pr-4 md:text-[14px]", s.enabled ? "text-up" : "text-white/40")}>
                      {s.enabled ? "Enabled" : "Disabled"}
                      <span className="font-normal text-white/40 md:hidden"> every {s.pollMinutes}m</span>
                    </td>
                    <td data-label="Last poll" className={cell}>
                      {s.lastPolledAt ? formatDateTime(s.lastPolledAt) : "Never"}
                    </td>
                    <td data-label="Last success" className={cell}>
                      {s.lastSuccessAt ? formatDateTime(s.lastSuccessAt) : "Never"}
                    </td>
                    <td className="hidden font-num text-[17px] font-semibold text-white md:table-cell md:py-3 md:text-right">
                      {s.pollMinutes}m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        )}
      </Panel>
    </div>
  );
}

function Figure({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{label}</p>
      <p className={cn("font-num text-[28px] font-semibold leading-8 text-white", className)}>{value}</p>
    </div>
  );
}
