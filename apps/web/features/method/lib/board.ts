import type { BoardRow, Verdict } from "@tradevantage/shared";

const flat = (s: string) => s.replace("/", "").toUpperCase();
export const slug = (symbol: string) => encodeURIComponent(flat(symbol));
export const sameSymbol = (a: string, b: string) => flat(a) === flat(b);

// Only a break-and-retest level being touched is news; same-way levels hug price all the time.
export const here = (r: BoardRow) => r.call !== "pass" && r.level?.type === "inverse" && r.level.status === "at-level";

const RANK: Record<Verdict, number> = { order: 0, watch: 1, pass: 2 };

/** Board order: at the level now, then the call, break-and-retest before same-way, then strength. Nothing in play goes last. */
export function rankRows(rows: BoardRow[]): BoardRow[] {
  const live = rows
    .filter((r) => r.call !== "pass" && r.level)
    .sort((a, b) => Number(here(b)) - Number(here(a)) || RANK[a.call] - RANK[b.call] || Number(b.level!.type === "inverse") - Number(a.level!.type === "inverse") || b.level!.score - a.level!.score);
  return [...live, ...rows.filter((r) => !live.includes(r))];
}

export type Group = "here" | Verdict;
export const groupOf = (r: BoardRow): Group => (here(r) ? "here" : r.call);
export const GROUPS: [Group, string][] = [
  ["here", "At level now"],
  ["order", "Order ready"],
  ["watch", "Needs confirmation"],
  ["pass", "Doesn't qualify"],
];
