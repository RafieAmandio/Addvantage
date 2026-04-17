import type { Primer } from "@/lib/mock/types";

/**
 * Pick the primer to surface in the "Primer of the day" tile.
 *
 * Priority:
 *   1. First unread accessible primer (respecting paid-tier gating).
 *   2. Otherwise, the first accessible primer.
 *   3. Otherwise, the first primer at all (fallback — should never happen
 *      with current mocks, but keeps the call total.)
 */
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
