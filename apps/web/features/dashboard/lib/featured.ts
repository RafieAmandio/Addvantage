import type { Primer } from "@/features/education/types";

export function pickFeaturedPrimer(
  primers: Primer[],
  readIds: string[],
  paid: boolean
): Primer | null {
  if (primers.length === 0) return null;
  const accessible = primers.filter((p) => !p.locked || paid);
  return (
    accessible.find((p) => !readIds.includes(p.id)) ??
    accessible[0] ??
    primers[0]
  );
}
