import type { Metadata } from "next";
import { listSources } from "@/features/sources/queries/sources";

export const metadata: Metadata = { title: "Sources" };
import { cn, formatDateTime } from "@/lib/cn";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSourcesPage() {
  const rows = await listSources();

  return (
    <div>
      <div className="mb-8">
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          Registry · Adapters
        </span>
        <h1 className="mt-2 font-mono text-2xl font-bold text-white">
          Source Registry
        </h1>
        <p className="mt-2 max-w-2xl font-mono text-sm font-light text-white/50">
          Ingestion adapters wired to the pipeline. Enable or disable via the
          database; changes take effect at the next scheduler tick.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="border border-gray-3 bg-gray-2/30 p-12 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            ● NO SOURCES REGISTERED
          </div>
          <div className="mt-3 font-display text-2xl text-white">
            Source registry is empty.
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest2 text-white/40">
            Run the DB migration to seed the sources table, then restart the
            worker.
          </p>
        </div>
      ) : (
        <div className="space-y-px bg-gray-3">
          {rows.map((s) => (
            <div key={s.code} className="grid grid-cols-12 gap-6 bg-black p-5 transition-colors hover:bg-gray-2">
              <div className="col-span-12 md:col-span-2">
                <div className="font-mono text-[11px] uppercase tracking-widest2 text-brand">
                  [{s.code}]
                </div>
                <div
                  className={cn(
                    "mt-1 font-mono text-[9px] uppercase tracking-widest2",
                    s.enabled ? "text-moss" : "text-white/40"
                  )}
                >
                  {s.enabled ? "● ENABLED" : "○ DISABLED"}
                </div>
              </div>
              <div className="col-span-12 md:col-span-10">
                <div className="font-display text-xl text-white">{s.name}</div>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block font-mono text-[9px] uppercase tracking-widest2 text-white/40 transition-colors hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                >
                  {s.url}
                </a>
                <div className="mt-3 grid grid-cols-1 gap-4 font-mono text-[9px] uppercase tracking-widest2 sm:grid-cols-3">
                  <Stat
                    label="Last poll"
                    value={s.lastPolledAt ? formatDateTime(s.lastPolledAt) : "—"}
                  />
                  <Stat
                    label="Last success"
                    value={s.lastSuccessAt ? formatDateTime(s.lastSuccessAt) : "—"}
                  />
                  <Stat label="Interval" value={`${s.pollMinutes}m`} />
                </div>
                {s.lastError && (
                  <div className="mt-2 border border-blood-bright/30 bg-blood-bright/5 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-blood-bright">
                    ● {s.lastError}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-white/40">{label}</div>
      <div className="text-white/80">{value}</div>
    </div>
  );
}
