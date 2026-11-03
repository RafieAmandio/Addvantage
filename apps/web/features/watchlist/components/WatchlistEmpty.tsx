import Link from "next/link";
import { Panel } from "@/components/ui/Panel";

export function WatchlistEmpty() {
  return (
    <Panel title="No pins yet">
      <p className="max-w-lg text-[15px] leading-[22px] text-white/55">
        Pin an instrument with the star on any news item, plan setup or instrument page. It shows up here with its
        price, live setups, history and news mentions.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/app/news" className="rounded-full bg-brand px-4 py-1.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-90">
          Browse news
        </Link>
        <Link href="/app/plan" className="rounded-full border border-white/[0.14] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-raised">
          Open live plan
        </Link>
      </div>
    </Panel>
  );
}
