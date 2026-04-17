import { SectionNumber } from "@/components/ui/Marker";

/**
 * Risks list on the plan detail page — numbered R0N entries with blood-tone
 * bar. Extracted from `PlanDetail.tsx`.
 */
export function PlanDetailRisks({
  risks,
  sectionNumber,
}: {
  risks: string[];
  sectionNumber: string;
}) {
  return (
    <section className="mt-12">
      <SectionNumber n={sectionNumber} label="RISKS" />
      <ul className="mt-4 space-y-2">
        {risks.map((r, i) => (
          <li
            key={i}
            className="flex items-start gap-3 border-l-2 border-blood/60 bg-blood/5 p-4"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-blood">
              R0{i + 1}
            </span>
            <span className="text-sm text-paper/80">{r}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
