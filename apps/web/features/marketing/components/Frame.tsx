import { cn } from "@/lib/cn";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";

/** A full-bleed rule that draws itself across the page. */
export const Rule = ({ from = "left" }: { from?: "left" | "right" }) => (
  <div className="w-full overflow-hidden">
    <div data-reveal="line" className="h-px bg-white/40" style={{ transformOrigin: from }} />
  </div>
);

/** The inset column with hairline sides that every framed block sits in. */
export const Inset = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("mx-4 border-x border-white/20 sm:mx-6 md:mx-[100px]", className)}>{children}</div>
);

/**
 * The old page's framed block: a mono header bar (label and number, which side
 * each sits on alternates like the original), rules that bleed off both edges,
 * then the content inside hairline sides.
 */
export function Frame({ id, label, num, flip, className, children }: { id?: string; label: string; num: string; flip?: boolean; className?: string; children: React.ReactNode }) {
  const l = <Scramble text={label} key="l" className="text-white" />;
  const n = <Scramble text={num} delay={150} key="n" className="text-brand" />;
  return (
    <section id={id} className={cn("relative z-10 bg-black pt-20 text-white md:pt-32", className)}>
      <Inset>
        <div data-reveal className="flex items-center justify-between px-6 py-4 font-mono text-base font-bold md:px-8">
          {flip ? [n, l] : [l, n]}
        </div>
      </Inset>
      <Rule />
      <Inset>{children}</Inset>
      <Rule from="right" />
    </section>
  );
}
