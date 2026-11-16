import type { ClassReport } from "@/features/reports/types";

// Offline-dev fixtures (NEXT_PUBLIC_MOCK_MODE=1). The Drive id is a placeholder,
// so the embed shows Drive's own "file not found" page in mock mode.
export const classReports = (): ClassReport[] =>
  [
    ["2026-11-13", "Gold held the Asia low into London. Why the desk waited for the sweep, and the two setups it passed on."],
    ["2026-11-06", "Pre-FOMC positioning on indices, the inside day on NAS100, and how to size into a news week."],
    ["2026-10-30", "Month-end flows, the failed breakout on EURUSD, and a full review of last week's journal entries."],
    ["2026-10-23", ""],
  ].map(([date, summary]) => ({
    slug: `${date}-tradevantage-class`,
    title: `${date} TradeVantage Class`,
    summary,
    author: "Anthony",
    driveId: "1mockReportPdfPlaceholderId000000",
    publishedAt: `${date}T13:00:00.000Z`,
  }));
