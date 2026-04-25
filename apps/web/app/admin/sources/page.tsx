import { listSources } from "@/features/sources/queries/sources";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSourcesPage() {
  const rows = await listSources();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="mb-6 font-display text-4xl text-white">
        Source <span className="italic text-brand">registry</span>
      </h1>

      <div className="space-y-px bg-gray-3">
        {rows.map((s) => (
          <div key={s.code} className="grid grid-cols-12 gap-6 text-black p-5">
            <div className="col-span-12 md:col-span-2">
              <div className="font-mono text-[11px] uppercase tracking-widest2 text-brand">
                [{s.code}]
              </div>
              <div
                className={
                  "mt-1 font-mono text-[9px] uppercase tracking-widest2 " +
                  (s.enabled ? "text-emerald-400" : "text-white/40")
                }
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
                className="mt-1 inline-block font-mono text-[9px] uppercase tracking-widest2 text-white/40 hover:text-brand"
              >
                {s.url}
              </a>
              <div className="mt-3 grid grid-cols-3 gap-4 font-mono text-[9px] uppercase tracking-widest2">
                <Stat
                  label="Last poll"
                  value={s.last_polled_at?.slice(0, 16).replace("T", " ") ?? "—"}
                />
                <Stat
                  label="Last success"
                  value={s.last_success_at?.slice(0, 16).replace("T", " ") ?? "—"}
                />
                <Stat label="Interval" value={`${s.poll_minutes}m`} />
              </div>
              {s.last_error && (
                <div className="mt-2 border border-blood bg-blood/10 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-red-500">
                  ● {s.last_error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
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
