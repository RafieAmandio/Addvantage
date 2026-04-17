/**
 * Returns a time-of-day salutation for the operator hero.
 * Hour is 0–23 local time.
 */
export function greeting(h: number): string {
  if (h < 5) return "Late shift";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Night watch";
}
