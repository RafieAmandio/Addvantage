import { Panel } from "@/components/ui/Panel";

export function PlanDetailRisks({
  risks,
}: {
  risks: string[];
  /** Kept for callers; sections are no longer numbered. */
  sectionNumber?: string;
}) {
  if (risks.length === 0) return null;
  return (
    <Panel title={`Risks · ${risks.length}`}>
      <ol className="-my-2.5 divide-y divide-white/[0.07]">
        {risks.map((r, i) => (
          <li key={i} className="flex gap-3 py-2.5 text-[14px] leading-[21px] text-white/90">
            <span className="w-4 shrink-0 font-num text-[15px] font-semibold text-down">{i + 1}</span>
            <span>{r}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
