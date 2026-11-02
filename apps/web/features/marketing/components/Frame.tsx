import { cn } from "@/lib/cn";
import { Scramble } from "@/features/marketing/components/ScrambleReveal";

/** A full-bleed hairline that draws itself across the page. */
export const Rule = ({ from = "left" }: { from?: "left" | "right" }) => (
  <div className="w-full overflow-hidden">
    <div data-reveal="line" className="h-px bg-tv-stone" style={{ transformOrigin: from }} />
  </div>
);

/** The inset column with hairline sides that every framed block sits in. */
export const Inset = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("mx-4 border-x border-tv-stone sm:mx-6 md:mx-[100px]", className)}>{children}</div>
);

/**
 * The framed block, on Paper: a mono header bar (label and number, which side each sits on
 * alternates), Stone hairlines that bleed off both edges, then the content inside hairline sides.
 */
export function Frame({ id, label, num, flip, className, children }: { id?: string; label: string; num: string; flip?: boolean; className?: string; children: React.ReactNode }) {
  const l = <Scramble text={label} key="l" />;
  const n = <Scramble text={num} delay={150} key="n" className="text-tv-mute" />;
  return (
    <section id={id} className={cn("relative z-10 bg-tv-paper pt-20 text-tv-ink md:pt-32", className)}>
      <Inset>
        <div data-reveal className="tv-eyebrow flex items-center justify-between px-6 py-4 text-[12px] md:px-8">
          {flip ? [n, l] : [l, n]}
        </div>
      </Inset>
      <Rule />
      <Inset>{children}</Inset>
      <Rule from="right" />
    </section>
  );
}
