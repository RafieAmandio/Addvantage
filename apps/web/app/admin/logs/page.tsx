import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/cn";
import type { Database } from "@tradevantage/db";

type IngestionRun = Database["public"]["Tables"]["ingestion_runs"]["Row"];

export const dynamic = "force-dynamic";

async function getRuns(): Promise<IngestionRun[]> {
  const { data, error } = await supabaseAdmin()
    .from("ingestion_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

async function getSources() {
  const { data } = await supabaseAdmin().from("sources").select("code, name");
  return data ?? [];
}

function statusBadge(status: string) {
  if (status === "ok")
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest2 text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        ok
      </span>
    );
  if (status === "error")
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest2 text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
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
      className={`font-mono text-[10px] tabular-nums ${n > 0 ? "text-brand" : "text-white/30"}`}
    >
      {n}
    </span>
  );
}

function duration(run: IngestionRun) {
  if (!run.finished_at) return "—";
  const ms =
    new Date(run.finished_at).getTime() - new Date(run.started_at).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export default async function IngestionLogsPage() {
  const [runs, sources] = await Promise.all([getRuns(), getSources()]);
  const sourceNames = Object.fromEntries(sources.map((s) => [s.code, s.name]));

  const totalFetched = runs.reduce((a, r) => a + r.items_fetched, 0);
  const totalNew = runs.reduce((a, r) => a + r.items_new, 0);
  const totalRephrased = runs.reduce((a, r) => a + r.items_rephrased, 0);
  const errors = runs.filter((r) => r.status === "error").length;

  return (
    <div className="bg-grid-fine min-h-screen px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
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

        {/* Summary stats */}
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
          <div className="mb-6 border border-red-400/30 bg-red-400/5 px-4 py-3 font-mono text-[10px] uppercase tracking-widest2 text-red-400">
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
            {/* Desktop table */}
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
                    className="grid grid-cols-12 gap-4 border-b border-gray-3 bg-black px-4 py-3 transition-colors hover:bg-gray-2"
                  >
                    <div className="col-span-2 font-mono text-[10px] uppercase tracking-widest2 text-brand">
                      [{run.source_code}]
                      <span className="ml-1 text-white/40">
                        {sourceNames[run.source_code] ?? ""}
                      </span>
                    </div>
                    <div className="col-span-1">{statusBadge(run.status)}</div>
                    <div className="col-span-2 font-mono text-[10px] uppercase tracking-widest2 text-white/50">
                      {formatDateTime(run.started_at)}
                    </div>
                    <div className="col-span-1 font-mono text-[10px] tabular-nums text-white/50">
                      {duration(run)}
                    </div>
                    <div className="col-span-1 text-center">
                      {countCell(run.items_fetched)}
                    </div>
                    <div className="col-span-1 text-center">
                      {countCell(run.items_new)}
                    </div>
                    <div className="col-span-1 text-center">
                      {countCell(run.items_rephrased)}
                    </div>
                    <div className="col-span-3 truncate font-mono text-[10px] text-red-400">
                      {run.error ?? (
                        <span className="text-white/20">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile cards */}
            <div className="space-y-px bg-gray-3 md:hidden">
              {runs.map((run) => (
                <div key={run.id} className="bg-black px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                      [{run.source_code}]
                    </span>
                    {statusBadge(run.status)}
                  </div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
                    {formatDateTime(run.started_at)} · {duration(run)}
                  </div>
                  <div className="mt-2 flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-[8px] uppercase tracking-widest2 text-white/30">F</span>
                      {countCell(run.items_fetched)}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-[8px] uppercase tracking-widest2 text-white/30">N</span>
                      {countCell(run.items_new)}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-[8px] uppercase tracking-widest2 text-white/30">R</span>
                      {countCell(run.items_rephrased)}
                    </div>
                  </div>
                  {run.error && (
                    <div className="mt-2 truncate font-mono text-[9px] text-red-400">
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
    </div>
  );
}
