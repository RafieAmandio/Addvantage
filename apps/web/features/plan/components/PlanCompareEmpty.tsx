import { cn } from "@/lib/cn";

export function PlanCompareEmpty({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border border-gray-3 bg-gray-2/40 p-12 text-center",
        className
      )}
    >
      <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
        ● PICK TWO PLANS
      </div>
      <div className="mt-3 font-display text-2xl text-white">
        Select a plan for each side to begin.
      </div>
      <p className="mt-2 max-w-md mx-auto font-mono text-[10px] uppercase tracking-widest2 text-white/40">
        The desk uses compare to pattern-match across recent plans — does
        this thesis rhyme with the last one, are we leaning the same way,
        are the invalidations consistent?
      </p>
    </div>
  );
}

export function PlanCompareInvalid({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border border-blood bg-blood/5 p-8 text-center",
        className
      )}
    >
      <div className="font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
        ● INVALID PLAN ID
      </div>
      <div className="mt-3 font-display text-2xl text-white">
        One or both IDs don&apos;t match a known plan.
      </div>
    </div>
  );
}
