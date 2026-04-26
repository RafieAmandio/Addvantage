export function ymdToDate(ymd: string): Date {
  return new Date(ymd + "T00:00:00Z");
}

export function dateToYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(ymd: string, n: number): string {
  const d = ymdToDate(ymd);
  d.setUTCDate(d.getUTCDate() + n);
  return dateToYmd(d);
}

export function addMonths(ymd: string, n: number): string {
  const d = ymdToDate(ymd);
  d.setUTCMonth(d.getUTCMonth() + n);
  return dateToYmd(d);
}

export function startOfWeek(ymd: string): string {
  const d = ymdToDate(ymd);
  const dow = d.getUTCDay(); // 0 = Sun, 1 = Mon
  const diff = (dow + 6) % 7; // make Mon = 0
  d.setUTCDate(d.getUTCDate() - diff);
  return dateToYmd(d);
}

export function startOfMonth(ymd: string): string {
  return ymd.slice(0, 7) + "-01";
}

export function endOfMonth(ymd: string): string {
  const d = ymdToDate(ymd);
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return dateToYmd(d);
}

export function monthGridDays(anchorYmd: string): string[] {
  const first = startOfMonth(anchorYmd);
  const gridStart = startOfWeek(first);
  const days: string[] = [];
  let cursor = gridStart;
  for (let i = 0; i < 42; i++) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function wibYmd(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}
