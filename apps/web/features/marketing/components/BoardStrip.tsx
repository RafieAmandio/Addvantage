import { cn } from "@/lib/cn";
import type { BoardLine } from "@/features/marketing/lib/landing";

const CALL = {
  order: "bg-black text-brand",
  watch: "border border-black text-black",
  pass: "text-black/65 line-through decoration-1",
} as const;

/** What the board called on every market at the last close, scrolling like a wire. */
export function BoardStrip({ board, asOf }: { board: BoardLine[]; asOf: string }) {
  const line = (b: BoardLine, hidden: boolean) => (
    <li key={`${b.sym}-${hidden}`} aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-3 whitespace-nowrap font-mono text-sm text-black">
      <span className="font-bold">{b.sym}</span>
      <span className={cn("rounded-[3px] px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em]", CALL[b.call])}>{b.call}</span>
      <span className="text-black/70">{b.why}</span>
      <span className="pl-3 text-black/25" aria-hidden>
        /
      </span>
    </li>
  );
  return (
    <section aria-label="The board at the last close" className="relative z-10 flex flex-col border-y border-black bg-white md:flex-row md:items-stretch">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-black/15 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-black sm:px-6 whitespace-nowrap md:w-[320px] md:border-b-0 md:border-r md:pl-[100px] md:pr-6">
        <span>The board, {asOf}</span>
        <span className="text-black/65 md:hidden">{board.length} markets</span>
      </div>
      <div className="lv-marquee min-w-0 flex-1 overflow-hidden py-3.5 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
        <ul className="flex w-max animate-ticker gap-6 [animation-duration:80s]">
          {board.map((b) => line(b, false))}
          {board.map((b) => line(b, true))}
        </ul>
      </div>
    </section>
  );
}
