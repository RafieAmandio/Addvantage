import Link from "next/link";
import { DataLabel } from "@/components/ui/Marker";
import { cn } from "@/lib/cn";

export function PillarShortcuts({
  paid,
  className,
}: {
  paid: boolean;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-gray-3", className)}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <DataLabel>● Jump to</DataLabel>
        <div className="mt-4 grid grid-cols-2 gap-px bg-gray-3 sm:grid-cols-3 lg:grid-cols-6">
          <PillarTile code="TX-01" label="News" href="/app/news" hint="g n" />
          <PillarTile
            code="TX-02"
            label="Calendar"
            href="/app/calendar"
            hint="g c"
          />
          <PillarTile
            code="TX-03"
            label="Trading Plan"
            href="/app/plan"
            hint="g p"
            locked={!paid}
          />
          <PillarTile
            code="TX-04"
            label="Consultation"
            href="/app/consult"
            hint="g k"
            locked={!paid}
          />
          <PillarTile
            code="TX-05"
            label="Education"
            href="/app/education"
            hint="g e"
          />
          <PillarTile
            code="TX-06"
            label="My Channel"
            href="/app/channel"
            hint="g m"
          />
        </div>
      </div>
    </section>
  );
}

function PillarTile({
  code,
  label,
  href,
  hint,
  locked,
}: {
  code: string;
  label: string;
  href: string;
  hint: string;
  locked?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between bg-black p-4 transition-all hover:-translate-y-px hover:bg-gray-2 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
    >
      <div>
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-brand">
          {code}
        </div>
        <div className="mt-1 font-display text-lg text-white transition-colors group-hover:text-brand">
          {label}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <kbd className="hidden border border-gray-3 bg-gray-2 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest2 text-white/40 sm:block">
          {hint}
        </kbd>
        {locked && (
          <span className="font-mono text-[8px] uppercase tracking-widest2 text-blood-bright">
            LOCKED
          </span>
        )}
      </div>
    </Link>
  );
}
