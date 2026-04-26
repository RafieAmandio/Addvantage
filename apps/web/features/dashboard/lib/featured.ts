import type { Primer } from "@/lib/mock/types";

export function pickFeaturedPrimer(
  primers: Primer[],
  readIds: string[],
  paid: boolean
): Primer {
  const accessible = primers.filter((p) => !p.locked || paid);
  return (
    accessible.find((p) => !readIds.includes(p.id)) ??
    accessible[0] ??
    primers[0]
  );
}
