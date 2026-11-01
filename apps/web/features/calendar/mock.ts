import type { CalendarEvent } from "@/features/calendar/types";

// Laid out on a real week so releases land on weekdays, with the usual
// weekend China data and OPEC+ meeting so the next 48 hours are never empty.
// wk: weeks from the current week (Mon to Sun). dow: 1 = Mon ... 7 = Sun. t: UTC time.
// `actual` only shows once the release time has passed.
type Seed = Omit<CalendarEvent, "ts"> & { wk: number; dow: number; t: string };

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
/** Short name of the month `k` months ago, for release reference periods. */
const M = (k: number) => MONTHS[(new Date().getUTCMonth() - k + 12) % 12];
const Q = () => `Q${Math.floor(((new Date().getUTCMonth() + 9) % 12) / 3) + 1}`;

function seeds(): Seed[] {
  return [
    // Last week
    { id: "C-101", wk: -1, dow: 1, t: "02:00", region: "CN", title: `Industrial Production YoY ${M(2)}`, impact: "medium", forecast: "5.2%", previous: "5.4%", actual: "5.0%" },
    { id: "C-102", wk: -1, dow: 1, t: "09:00", region: "EU", title: `German Ifo Business Climate ${M(1)}`, impact: "medium", forecast: "87.9", previous: "87.7", actual: "88.2" },
    { id: "C-103", wk: -1, dow: 2, t: "07:00", region: "UK", title: `CPI YoY ${M(2)}`, impact: "high", forecast: "3.6%", previous: "3.8%", actual: "3.5%", notes: "Below forecast for the second month. Gilts rallied and sterling dipped on the release." },
    { id: "C-104", wk: -1, dow: 2, t: "14:00", region: "US", title: `Consumer Confidence ${M(1)}`, impact: "medium", forecast: "93.8", previous: "94.2", actual: "92.6" },
    { id: "C-105", wk: -1, dow: 3, t: "15:30", region: "US", title: "EIA Crude Oil Inventories", impact: "medium", forecast: "-1.4M", previous: "-0.8M", actual: "-2.9M" },
    { id: "C-106", wk: -1, dow: 3, t: "18:00", region: "US", title: "FOMC Interest Rate Decision", impact: "high", forecast: "3.75%", previous: "3.75%", actual: "3.75%", notes: "Hold as expected. The statement kept the easing bias but the press conference leaned hawkish on services inflation." },
    { id: "C-107", wk: -1, dow: 4, t: "13:15", region: "EU", title: "ECB Deposit Facility Rate", impact: "high", forecast: "2.00%", previous: "2.00%", actual: "2.00%", relatedNewsId: "N-0105" },
    { id: "C-108", wk: -1, dow: 4, t: "12:30", region: "US", title: `GDP Growth Rate QoQ Adv ${Q()}`, impact: "high", forecast: "2.3%", previous: "3.1%", actual: "2.6%" },
    { id: "C-109", wk: -1, dow: 4, t: "12:30", region: "US", title: "Initial Jobless Claims", impact: "medium", forecast: "221K", previous: "218K", actual: "224K" },
    { id: "C-110", wk: -1, dow: 5, t: "03:00", region: "JP", title: "BoJ Interest Rate Decision", impact: "high", forecast: "0.75%", previous: "0.75%", actual: "0.75%" },
    { id: "C-111", wk: -1, dow: 5, t: "10:00", region: "EU", title: `CPI Flash YoY ${M(1)}`, impact: "high", forecast: "2.2%", previous: "2.2%", actual: "2.1%" },
    { id: "C-112", wk: -1, dow: 5, t: "12:30", region: "US", title: `Core PCE Price Index MoM ${M(2)}`, impact: "high", forecast: "0.3%", previous: "0.2%", actual: "0.3%", notes: "In line on the headline, firm in services ex housing.", relatedNewsId: "N-0107" },
    { id: "C-113", wk: -1, dow: 5, t: "12:30", region: "US", title: `Personal Spending MoM ${M(2)}`, impact: "medium", forecast: "0.4%", previous: "0.6%", actual: "0.5%" },
    { id: "C-114", wk: -1, dow: 5, t: "13:45", region: "US", title: `Chicago PMI ${M(1)}`, impact: "low", forecast: "46.1", previous: "45.8", actual: "47.3" },
    { id: "C-115", wk: -1, dow: 6, t: "01:30", region: "CN", title: `NBS Manufacturing PMI ${M(1)}`, impact: "high", forecast: "49.8", previous: "49.8", actual: "49.6" },
    { id: "C-116", wk: -1, dow: 7, t: "11:00", region: "GLOBAL", title: "OPEC+ Monthly Meeting", impact: "high", notes: "Output plan for next month unchanged.", relatedNewsId: "N-0108" },

    // This week
    { id: "C-201", wk: 0, dow: 1, t: "01:45", region: "CN", title: `Caixin Manufacturing PMI ${M(1)}`, impact: "medium", forecast: "50.6", previous: "50.9", actual: "51.2", relatedNewsId: "N-0117" },
    { id: "C-202", wk: 0, dow: 1, t: "09:00", region: "EU", title: `HCOB Manufacturing PMI Final ${M(1)}`, impact: "medium", forecast: "49.4", previous: "49.4", actual: "49.6", relatedNewsId: "N-0120" },
    { id: "C-203", wk: 0, dow: 1, t: "09:30", region: "UK", title: `S&P Global Manufacturing PMI Final ${M(1)}`, impact: "low", forecast: "49.6", previous: "49.6", actual: "49.8" },
    { id: "C-204", wk: 0, dow: 1, t: "15:00", region: "US", title: `ISM Manufacturing PMI ${M(1)}`, impact: "high", forecast: "49.4", previous: "49.1", actual: "48.7", notes: "Prices paid is the component that moves yields. A hot print there matters more than the headline." },
    { id: "C-205", wk: 0, dow: 1, t: "15:00", region: "US", title: `ISM Manufacturing Prices ${M(1)}`, impact: "medium", forecast: "61.2", previous: "62.4", actual: "63.0" },
    { id: "C-206", wk: 0, dow: 2, t: "03:30", region: "GLOBAL", title: "RBA Cash Rate Decision", impact: "high", forecast: "3.60%", previous: "3.60%", actual: "3.60%", relatedNewsId: "N-0118" },
    { id: "C-207", wk: 0, dow: 2, t: "15:00", region: "US", title: `JOLTS Job Openings ${M(2)}`, impact: "high", forecast: "7.18M", previous: "7.23M", actual: "7.05M" },
    { id: "C-208", wk: 0, dow: 2, t: "15:00", region: "US", title: `Factory Orders MoM ${M(2)}`, impact: "low", forecast: "0.4%", previous: "-0.8%", actual: "0.6%" },
    { id: "C-209", wk: 0, dow: 2, t: "21:45", region: "GLOBAL", title: `NZ Unemployment Rate ${Q()}`, impact: "medium", forecast: "5.3%", previous: "5.2%", actual: "5.4%" },
    { id: "C-210", wk: 0, dow: 3, t: "04:00", region: "ID", title: `GDP Growth Rate YoY ${Q()}`, impact: "medium", forecast: "4.95%", previous: "5.04%", actual: "4.91%" },
    { id: "C-211", wk: 0, dow: 3, t: "10:00", region: "EU", title: `Retail Sales MoM ${M(2)}`, impact: "low", forecast: "0.2%", previous: "-0.1%", actual: "0.3%" },
    { id: "C-212", wk: 0, dow: 3, t: "13:15", region: "US", title: `ADP Employment Change ${M(1)}`, impact: "high", forecast: "112K", previous: "98K", actual: "131K" },
    { id: "C-213", wk: 0, dow: 3, t: "15:00", region: "US", title: `ISM Services PMI ${M(1)}`, impact: "high", forecast: "51.8", previous: "52.0", actual: "52.4", notes: "Services is the tell on whether the Fed gets the disinflation it wants." },
    { id: "C-214", wk: 0, dow: 3, t: "15:30", region: "US", title: "EIA Crude Oil Inventories", impact: "medium", forecast: "-1.1M", previous: "-2.9M", actual: "-3.4M" },
    { id: "C-215", wk: 0, dow: 4, t: "03:00", region: "CN", title: `Trade Balance ${M(1)}`, impact: "medium", forecast: "$92.4B", previous: "$90.5B", actual: "$95.7B" },
    { id: "C-216", wk: 0, dow: 4, t: "12:00", region: "UK", title: "BoE Interest Rate Decision", impact: "high", forecast: "3.75%", previous: "4.00%", actual: "3.75%", notes: "A cut is priced. The vote split is the trade: a 5 to 4 split is hawkish for sterling." },
    { id: "C-217", wk: 0, dow: 4, t: "13:30", region: "US", title: "Initial Jobless Claims", impact: "medium", forecast: "222K", previous: "224K", actual: "219K" },
    { id: "C-218", wk: 0, dow: 4, t: "13:30", region: "US", title: `Nonfarm Productivity QoQ Prel ${Q()}`, impact: "low", forecast: "1.9%", previous: "2.4%", actual: "2.1%" },
    { id: "C-219", wk: 0, dow: 5, t: "13:30", region: "US", title: `Non Farm Payrolls ${M(1)}`, impact: "high", forecast: "118K", previous: "132K", actual: "104K", notes: "The single most important US number of the month. Everything else is a footnote." },
    { id: "C-220", wk: 0, dow: 5, t: "13:30", region: "US", title: `Unemployment Rate ${M(1)}`, impact: "high", forecast: "4.4%", previous: "4.3%", actual: "4.4%" },
    { id: "C-221", wk: 0, dow: 5, t: "13:30", region: "US", title: `Average Hourly Earnings MoM ${M(1)}`, impact: "high", forecast: "0.3%", previous: "0.3%", actual: "0.4%" },
    { id: "C-222", wk: 0, dow: 5, t: "15:00", region: "US", title: `Michigan Consumer Sentiment Prel ${M(0)}`, impact: "medium", forecast: "51.8", previous: "51.4", actual: "50.9" },
    { id: "C-223", wk: 0, dow: 6, t: "01:30", region: "CN", title: `CPI YoY ${M(1)}`, impact: "medium", forecast: "0.2%", previous: "0.1%", actual: "0.3%" },
    { id: "C-224", wk: 0, dow: 6, t: "01:30", region: "CN", title: `PPI YoY ${M(1)}`, impact: "low", forecast: "-2.1%", previous: "-2.3%", actual: "-2.0%" },
    { id: "C-225", wk: 0, dow: 7, t: "11:00", region: "GLOBAL", title: "OPEC+ Ministerial Meeting", impact: "high", notes: "Market expects no change. A surprise hike in supply is the downside risk for crude." },

    // Next week
    { id: "C-301", wk: 1, dow: 1, t: "23:50", region: "JP", title: `Current Account ${M(2)}`, impact: "low", forecast: "¥3.12T", previous: "¥2.86T" },
    { id: "C-302", wk: 1, dow: 2, t: "07:00", region: "UK", title: `Unemployment Rate ${M(3)}`, impact: "medium", forecast: "4.9%", previous: "4.8%" },
    { id: "C-303", wk: 1, dow: 2, t: "10:00", region: "EU", title: `German ZEW Economic Sentiment ${M(0)}`, impact: "medium", forecast: "41.5", previous: "39.3" },
    { id: "C-304", wk: 1, dow: 3, t: "07:20", region: "ID", title: "BI Rate Decision", impact: "high", forecast: "4.75%", previous: "4.75%", notes: "The rupiah level matters more than the rate. Watch for language on intervention." },
    { id: "C-305", wk: 1, dow: 3, t: "13:30", region: "US", title: `CPI YoY ${M(1)}`, impact: "high", forecast: "3.1%", previous: "3.2%" },
    { id: "C-306", wk: 1, dow: 3, t: "13:30", region: "US", title: `Core CPI MoM ${M(1)}`, impact: "high", forecast: "0.3%", previous: "0.3%" },
    { id: "C-307", wk: 1, dow: 4, t: "00:30", region: "GLOBAL", title: `AU Employment Change ${M(1)}`, impact: "high", forecast: "22.5K", previous: "14.9K" },
    { id: "C-308", wk: 1, dow: 4, t: "07:00", region: "UK", title: `GDP Growth Rate QoQ Prel ${Q()}`, impact: "high", forecast: "0.2%", previous: "0.3%" },
    { id: "C-309", wk: 1, dow: 4, t: "13:30", region: "US", title: `PPI MoM ${M(1)}`, impact: "medium", forecast: "0.2%", previous: "0.3%" },
    { id: "C-310", wk: 1, dow: 4, t: "13:30", region: "US", title: "Initial Jobless Claims", impact: "medium", forecast: "223K", previous: "219K" },
    { id: "C-311", wk: 1, dow: 5, t: "02:00", region: "CN", title: `Retail Sales YoY ${M(1)}`, impact: "medium", forecast: "3.1%", previous: "3.0%" },
    { id: "C-312", wk: 1, dow: 5, t: "13:30", region: "US", title: `Retail Sales MoM ${M(1)}`, impact: "high", forecast: "0.3%", previous: "0.5%" },
    { id: "C-313", wk: 1, dow: 5, t: "18:00", region: "US", title: "Fed Chair Speech", impact: "high", notes: "First remarks since the payrolls print. Any hint on December sets the tone for the dollar." },
    { id: "C-314", wk: 1, dow: 7, t: "23:50", region: "JP", title: `GDP Growth Rate QoQ Prel ${Q()}`, impact: "medium", forecast: "0.2%", previous: "0.5%" },
  ];
}

/** Calendar events placed around the current week. Fresh on every call. */
export function calendar(): CalendarEvent[] {
  const now = Date.now();
  // Monday of the current week in WIB (UTC+7), the app's clock. Sunday belongs to the week it ends.
  const monday = new Date(now + 7 * 3600_000);
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return seeds().map(({ wk, dow, t, actual, ...e }) => {
    const [h, m] = t.split(":").map(Number);
    const at = monday.getTime() + ((wk * 7 + dow - 1) * 24 + h) * 3600_000 + m * 60_000;
    return { ...e, ts: new Date(at).toISOString(), ...(actual && at < now ? { actual } : {}) };
  });
}
