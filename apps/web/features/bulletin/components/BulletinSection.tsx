import { BulletinCard } from "./BulletinCard";
import type { Bulletin } from "../types";

function Group({ title, bulletins }: { title: string; bulletins: Bulletin[] }) {
  if (bulletins.length === 0) return null;
  return (
    <div className="mt-6 first:mt-5">
      <h3 className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
        {title}
        <span className="ml-2 text-white/30">{bulletins.length}</span>
      </h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {bulletins.map((b) => (
          <BulletinCard key={b.id} bulletin={b} />
        ))}
      </div>
    </div>
  );
}

export function BulletinSection({ bulletins }: { bulletins: Bulletin[] }) {
  if (bulletins.length === 0) return null;

  // Already sorted most-recent-first by the API; just split by status.
  const active = bulletins.filter((b) => b.status === "active");
  const watching = bulletins.filter((b) => b.status === "watching");

  return (
    <section aria-label="Bulletin" className="border-b border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xs font-medium text-white/50">Bulletin</h2>
          <span className="text-[11px] text-white/30">what we&apos;re watching</span>
        </div>

        <Group title="Active" bulletins={active} />
        <Group title="Watching" bulletins={watching} />
      </div>
    </section>
  );
}
