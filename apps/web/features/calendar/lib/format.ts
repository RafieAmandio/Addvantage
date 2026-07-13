import { ymdToDate } from "./date";

export function formatCalendarTime(
  iso: string,
  _anchorLocalYmd: string,
  showOffset = false
): string {
  void showOffset;
  const d = new Date(iso);
  const wibMs = d.getTime() + 7 * 60 * 60 * 1000;
  const wib = new Date(wibMs);
  const hh = String(wib.getUTCHours()).padStart(2, "0");
  const mm = String(wib.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} WIB`;
}

export function formatDayHeader(ymd: string): string {
  const d = ymdToDate(ymd);
  const weekday = d.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
  const month = d.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const day = d.getUTCDate();
  return `${weekday} ${month} ${day}`;
}

export function shortName(title: string): string {
  return title
    .replace(/\s+(MoM|YoY|QoQ|Final\s+Q\d|Q\d|Prel|[A-Z]{3})\b/g, "")
    .replace(/\s+Rate$/i, "")
    .replace(/\s+MoM\/YoY.*$/i, "")
    .trim();
}
