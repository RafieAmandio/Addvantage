import {
  TODAY_YMD,
  REGIONS,
  type ImpactFilter,
  type RegionFilter,
  type ViewMode,
} from "../types";
import {
  addDays,
  addMonths,
  endOfMonth,
  startOfMonth,
  startOfWeek,
  ymdToDate,
} from "./date";
import { formatDayHeader } from "./format";

export function rangeForView(view: ViewMode, anchorYmd: string): {
  start: string;
  end: string;
} {
  if (view === "day") return { start: anchorYmd, end: anchorYmd };
  if (view === "week") {
    const start = startOfWeek(anchorYmd);
    return { start, end: addDays(start, 6) };
  }
  return { start: startOfMonth(anchorYmd), end: endOfMonth(anchorYmd) };
}

export function stepAnchor(view: ViewMode, anchorYmd: string, dir: 1 | -1): string {
  if (view === "day") return addDays(anchorYmd, dir);
  if (view === "week") return addDays(anchorYmd, dir * 7);
  return addMonths(anchorYmd, dir);
}

export function rangeLabel(view: ViewMode, anchorYmd: string): string {
  const { start, end } = rangeForView(view, anchorYmd);
  if (view === "day") {
    return formatDayHeader(start);
  }
  if (view === "week") {
    const a = ymdToDate(start);
    const b = ymdToDate(end);
    const sameMonth = a.getUTCMonth() === b.getUTCMonth();
    const left = a.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    const right = sameMonth
      ? b.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" })
      : b.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });
    return `${left} — ${right}`;
  }
  // month
  return ymdToDate(anchorYmd).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function parseViewMode(v: string | null): ViewMode {
  return v === "day" || v === "month" ? v : "week";
}

export function parseImpact(v: string | null): ImpactFilter {
  return v === "high" || v === "medium" || v === "low" ? v : "all";
}

export function parseRegion(v: string | null): RegionFilter {
  if (!v) return "all";
  return (REGIONS as ReadonlyArray<string>).includes(v)
    ? (v as RegionFilter)
    : "all";
}

export function parseAnchor(v: string | null): string {
  if (!v) return TODAY_YMD;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  return TODAY_YMD;
}
