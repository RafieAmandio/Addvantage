import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SourceRow {
  code: string;
  name: string;
  url: string;
  enabled: boolean;
  poll_minutes: number;
  last_polled_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
}

export default async function AdminSourcesPage() {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("sources")
    .select("code,name,url,enabled,poll_minutes,last_polled_at,last_success_at,last_error")
    .order("code");

  const rows = (data ?? []) as SourceRow[];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="mb-6 font-display text-4xl text-paper">
        Source <span className="italic text-amber">registry</span>
      </h1>

      <div className="space-y-px bg-ink-3">
        {rows.map((s) => (
          <div key={s.code} className="grid grid-cols-12 gap-6 bg-ink p-5">
            <div className="col-span-12 md:col-span-2">
              <div className="font-mono text-[11px] uppercase tracking-widest2 text-amber">
                [{s.code}]
              </div>
              <div
                className={
                  "mt-1 font-mono text-[9px] uppercase tracking-widest2 " +
                  (s.enabled ? "text-emerald-400" : "text-paper/40")
                }
              >
                {s.enabled ? "● ENABLED" : "○ DISABLED"}
              </div>
            </div>
            <div className="col-span-12 md:col-span-10">
              <div className="font-display text-xl text-paper">{s.name}</div>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block font-mono text-[9px] uppercase tracking-widest2 text-paper/40 hover:text-amber"
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
                <div className="mt-2 border border-blood bg-blood/10 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-blood">
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
      <div className="text-paper/40">{label}</div>
      <div className="text-paper/80">{value}</div>
    </div>
  );
}
