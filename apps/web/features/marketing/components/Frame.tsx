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
    <section id={id} className={cn("relative z-10 flex flex-col bg-tv-paper pt-14 text-tv-ink md:min-h-[100svh] md:pt-[clamp(2.5rem,7svh,4.5rem)]", className)}>
      <Inset>
        <div data-reveal className="tv-eyebrow flex items-center justify-between px-6 py-4 text-[12px] md:px-8">
          {flip ? [n, l] : [l, n]}
        </div>
      </Inset>
      <Rule />
      {/* The content stretches to fill the screen, so a frame never reads as a thin band. */}
      <Inset className="flex flex-1 flex-col [&>*]:flex-1">{children}</Inset>
      <Rule from="right" />
    </section>
  );
}
