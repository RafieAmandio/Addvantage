import type { Metadata } from "next";
import { apiGet } from "@/lib/api/client-server";

export const metadata: Metadata = { title: "Ingestion Logs" };
import { cn, formatDateTime } from "@/lib/cn";

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

function statusBadge(status: string) {
  if (status === "ok")
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest2 text-moss">
        <span className="h-1.5 w-1.5 rounded-full bg-moss" />
        ok
      </span>
    );
  if (status === "error")
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest2 text-blood-bright">
        <span className="h-1.5 w-1.5 rounded-full bg-blood-bright" />
        error
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest2 text-brand">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
      {status}
    </span>
  );
}

function countCell(n: number) {
  return (
    <span
      className={cn("font-mono text-[10px] tabular-nums", n > 0 ? "text-brand" : "text-white/30")}
    >
      {n}
    </span>
  );
}

function duration(run: IngestionRun) {
  if (!run.finishedAt) return "—";
  const ms =
    new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export default async function IngestionLogsPage() {
  const { runs, sources } = await getData();
  const sourceNames = Object.fromEntries(sources.map((s) => [s.code, s.name]));

  const totalFetched = runs.reduce((a, r) => a + r.itemsFetched, 0);
  const totalNew = runs.reduce((a, r) => a + r.itemsNew, 0);
  const totalRephrased = runs.reduce((a, r) => a + r.itemsRephrased, 0);
  const errors = runs.filter((r) => r.status === "error").length;

  return (
    <div className="stagger mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
          OPERATOR // ADMIN
        </div>
        <h1 className="mt-1 font-display text-4xl text-white">
          Ingestion <span className="italic text-brand">Logs</span>
        </h1>
        <p className="mt-2 max-w-2xl font-display text-lg text-white/60">
          Per-source pipeline runs — what the adapters fetched, how many the
          AI rephrased, and any errors.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-px bg-gray-3 md:grid-cols-4">
        {[
          { label: "Runs", value: runs.length },
          { label: "Fetched", value: totalFetched },
          { label: "New", value: totalNew },
          { label: "Rephrased", value: totalRephrased },
        ].map(({ label, value }) => (
          <div key={label} className="bg-black px-4 py-3">
            <div className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
              {label}
            </div>
            <div className="mt-1 font-mono text-2xl tabular-nums text-brand">
              {value}
            </div>
          </div>
        ))}
      </div>

      {errors > 0 && (
        <div className="mb-6 border border-blood-bright/30 bg-blood-bright/5 px-4 py-3 font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
          {errors} run{errors > 1 ? "s" : ""} with errors in last {runs.length} runs
        </div>
      )}

      {runs.length === 0 ? (
        <div className="border border-gray-3 bg-gray-2/30 p-12 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            No pipeline runs yet
          </div>
          <div className="mt-2 font-display text-sm text-white/30">
            Runs appear here after the worker ingests its first source.
          </div>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <div className="space-y-px bg-gray-3">
              <div className="grid grid-cols-12 gap-4 bg-black px-4 py-2 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
                <div className="col-span-2">Source</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Started</div>
                <div className="col-span-1">Duration</div>
                <div className="col-span-1 text-center">Fetched</div>
                <div className="col-span-1 text-center">New</div>
                <div className="col-span-1 text-center">Rephrased</div>
                <div className="col-span-3">Error</div>
              </div>

              {runs.map((run) => (
                <div
                  key={run.id}
                  className="grid grid-cols-12 gap-4 bg-black px-4 py-3 transition-colors hover:bg-gray-2"
                >
                  <div className="col-span-2 font-mono text-[10px] uppercase tracking-widest2 text-brand">
                    [{run.sourceCode}]
                    <span className="ml-1 text-white/40">
                      {sourceNames[run.sourceCode] ?? ""}
                    </span>
                  </div>
                  <div className="col-span-1">{statusBadge(run.status)}</div>
                  <div className="col-span-2 font-mono text-[10px] uppercase tracking-widest2 text-white/50">
                    {formatDateTime(run.startedAt)}
                  </div>
                  <div className="col-span-1 font-mono text-[10px] tabular-nums text-white/50">
                    {duration(run)}
                  </div>
                  <div className="col-span-1 text-center">
                    {countCell(run.itemsFetched)}
                  </div>
                  <div className="col-span-1 text-center">
                    {countCell(run.itemsNew)}
                  </div>
                  <div className="col-span-1 text-center">
                    {countCell(run.itemsRephrased)}
                  </div>
                  <div className="col-span-3 truncate font-mono text-[10px] text-blood-bright">
                    {run.error ?? (
                      <span className="text-white/20">{"—"}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-px bg-gray-3 md:hidden">
            {runs.map((run) => (
              <div key={run.id} className="bg-black px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                    [{run.sourceCode}]
                  </span>
                  {statusBadge(run.status)}
                </div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                  {formatDateTime(run.startedAt)} · {duration(run)}
                </div>
                <div className="mt-2 flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-[8px] uppercase tracking-widest2 text-white/30">F</span>
                    {countCell(run.itemsFetched)}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-[8px] uppercase tracking-widest2 text-white/30">N</span>
                    {countCell(run.itemsNew)}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-[8px] uppercase tracking-widest2 text-white/30">R</span>
                    {countCell(run.itemsRephrased)}
                  </div>
                </div>
                {run.error && (
                  <div className="mt-2 truncate font-mono text-[9px] text-blood-bright">
                    {run.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 font-mono text-[9px] uppercase tracking-widest2 text-white/20">
        Showing last {runs.length} runs
      </div>
    </div>
  );
}
