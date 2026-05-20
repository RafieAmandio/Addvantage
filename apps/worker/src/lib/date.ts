/**
 * TwelveData returns "YYYY-MM-DD HH:MM:SS" (UTC) or "YYYY-MM-DD" for 1day.
 * Convert to ISO 8601 with trailing Z.
 */
export function toIsoUtc(datetime: string): string {
  const withT = datetime.includes(" ") ? datetime.replace(" ", "T") : datetime;
  const withTime = withT.length === 10 ? `${withT}T00:00:00` : withT;
  return `${withTime}Z`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
