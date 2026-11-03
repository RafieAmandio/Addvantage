import type { Metadata } from "next";
import { apiGet } from "@/lib/api/client-server";

export const metadata: Metadata = { title: "Ingestion Logs" };
import { cn, formatDateTime } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";

const th = "pb-2 text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";
const num =
  "before:block before:text-[11px] before:font-semibold before:uppercase before:tracking-[0.08em] before:text-white/30 before:content-[attr(data-label)] md:py-2.5 md:pr-4 md:text-right md:before:hidden";

interface IngestionRun {
  id: string;
  sourceCode: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  itemsFetched: number;
  itemsNew: number;
  itemsRephrased: number;
  error: string | null;
}

interface Source {
  code: string;
  name: string;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getData(): Promise<{ runs: IngestionRun[]; sources: Source[] }> {
  try {
    const result = await apiGet<{ runs: IngestionRun[]; sources: Source[] }>("/ingestion/runs?limit=100");
    return result;
  } catch {
    return { runs: [], sources: [] };
  }
}

function statusText(status: string) {
  const color = status === "ok" ? "text-up" : status === "error" ? "text-down" : "text-brand";
  return <span className={cn("text-[13px] font-medium", color)}>{status === "ok" ? "OK" : status === "error" ? "Error" : status}</span>;
}

function countCell(n: number) {
  return (
    <span className={cn("font-num text-[17px] font-semibold", n > 0 ? "text-white" : "text-white/25")}>
      {n}
    </span>
  );
}

function duration(run: IngestionRun) {
  if (!run.finishedAt) return "Running";
  const ms =
    new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export default async function IngestionLogsPage() {
  const { runs, sources } = await getData();
  const sourceNames = Object.fromEntries(sources.map((s) => [s.code, s.name]));

  const totalFetched = runs.reduce((a, r) => a + (r.itemsFetched ?? 0), 0);
  const totalNew = runs.reduce((a, r) => a + (r.itemsNew ?? 0), 0);
  const totalRephrased = runs.reduce((a, r) => a + (r.itemsRephrased ?? 0), 0);
  const errors = runs.filter((r) => r.status === "error").length;

  return (
    <div className="space-y-4">
      <Panel
        title="Ingestion logs"
        sub="Per-source pipeline runs: what the adapters fetched, how many the AI rephrased, and any errors."
      >
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {[
            { label: "Runs", value: runs.length },
            { label: "Fetched", value: totalFetched },
            { label: "New", value: totalNew },
            { label: "Rephrased", value: totalRephrased },
            { label: "Errors", value: errors },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{label}</p>
              <p
                className={cn(
                  "font-num text-[28px] font-semibold leading-8",
                  label === "Errors" && value > 0 ? "text-down" : "text-white",
                )}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Runs" sub={`Last ${runs.length} runs, newest first`}>
        {runs.length === 0 ? (
          <div className="rounded-xl bg-raised px-5 py-12 text-center">
            <p className="text-[15px] font-medium text-white">No pipeline runs yet.</p>
            <p className="mt-1 text-[13px] text-white/55">
              Runs appear here after the worker ingests its first source.
            </p>
          </div>
        ) : (
          <table className="block w-full text-[14px] md:table">
            <thead className="hidden border-b border-white/[0.07] md:table-header-group">
              <tr>
                <th className={th}>Source</th>
                <th className={th}>Status</th>
                <th className={th}>Started</th>
                <th className={cn(th, "text-right")}>Duration</th>
                <th className={cn(th, "text-right")}>Fetched</th>
                <th className={cn(th, "text-right")}>New</th>
                <th className={cn(th, "text-right")}>Rephrased</th>
                <th className={cn(th, "pl-6")}>Error</th>
              </tr>
            </thead>
            <tbody className="block divide-y divide-white/[0.07] md:table-row-group">
              {runs.map((run) => (
                <tr
                  key={run.id}
                  className="grid grid-cols-3 gap-x-4 gap-y-1.5 py-3 md:table-row md:py-0"
                >
                  <td className="col-span-2 min-w-0 md:py-2.5 md:pr-4">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
                      {run.sourceCode}
                    </span>
                    <span className="ml-2 text-[13px] text-white/35">{sourceNames[run.sourceCode] !== run.sourceCode ? sourceNames[run.sourceCode] ?? "" : ""}</span>
                  </td>
                  <td className="text-right md:py-2.5 md:pr-4 md:text-left">{statusText(run.status)}</td>
                  <td className="col-span-2 text-[13px] text-white/55 md:whitespace-nowrap md:py-2.5 md:pr-4">
                    {formatDateTime(run.startedAt)}
                  </td>
                  <td className="text-right text-[13px] text-white/55 md:py-2.5 md:pr-4">{duration(run)}</td>
                  <td data-label="Fetched" className={num}>{countCell(run.itemsFetched)}</td>
                  <td data-label="New" className={num}>{countCell(run.itemsNew)}</td>
                  <td data-label="Rephrased" className={num}>{countCell(run.itemsRephrased)}</td>
                  <td
                    className={cn(
                      "col-span-3 min-w-0 text-[13px] text-down md:max-w-[320px] md:truncate md:py-2.5 md:pl-6",
                      !run.error && "hidden md:table-cell",
                    )}
                    title={run.error ?? undefined}
                  >
                    {run.error ?? <span className="text-white/20">None</span>}
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
