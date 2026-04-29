import Link from "next/link";
import { cn } from "@/lib/cn";

export function PillarShortcuts({
  paid,
  className,
}: {
  paid: boolean;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-white/[0.06]", className)}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <p className="text-sm text-white/40">Quick access</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <PillarTile label="News" href="/app/news" hint="g n" />
          <PillarTile label="Calendar" href="/app/calendar" hint="g c" />
          <PillarTile label="Trading Plan" href="/app/plan" hint="g p" locked={!paid} />
          <PillarTile label="Consultation" href="/app/consult" hint="g k" locked={!paid} />
          <PillarTile label="Education" href="/app/education" hint="g e" />
          <PillarTile label="Channel" href="/app/channel" hint="g m" />
        </div>
      </div>
    </section>
  );
}

function PillarTile({
  label,
  href,
  hint,
  locked,
}: {
  label: string;
  href: string;
  hint: string;
  locked?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.1] hover:bg-white/[0.04] focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
    >
      <span className="text-sm font-medium text-white transition-colors group-hover:text-brand">
        {label}
      </span>
      <div className="flex flex-col items-end gap-1">
        <kbd className="hidden rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/25 sm:block">
          {hint}
        </kbd>
        {locked && (
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/25">
            PRO
          </span>
        )}
      </div>
    </Link>
  );
}
