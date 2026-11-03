import { cn } from "@/lib/cn";

export function PlanCompareEmpty({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-panel px-5 py-10 text-center", className)}>
      <p className="text-[17px] font-medium text-white">Select a plan for each side to begin.</p>
      <p className="mx-auto mt-1 max-w-md text-[14px] leading-[21px] text-white/55">
        Does this thesis rhyme with the last one? Are we leaning the same way? Are the invalidations consistent?
      </p>
    </div>
  );
}

export function PlanCompareInvalid({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-panel px-5 py-10 text-center", className)}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-down">Unknown plan ID</p>
      <p className="mt-1 text-[17px] font-medium text-white">One or both IDs don&apos;t match a known plan.</p>
    </div>
  );
}
