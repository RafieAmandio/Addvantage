export interface TickerItem {
  sym: string;
  val: string;
  chg: string;
  dir: "up" | "down";
}

export const tickerItems: TickerItem[] = [
  // Indonesian / IDX-relevant first — primary audience
  { sym: "JKSE", val: "7,284", chg: "+0.42%", dir: "up" },
  { sym: "LQ45", val: "942.18", chg: "+0.31%", dir: "up" },
  { sym: "USDIDR", val: "15,890", chg: "+0.18%", dir: "up" },
  { sym: "BBCA", val: "9,825", chg: "+0.51%", dir: "up" },
  { sym: "BBRI", val: "5,475", chg: "-0.27%", dir: "down" },
  { sym: "TLKM", val: "3,240", chg: "+0.62%", dir: "up" },
  { sym: "ASII", val: "5,100", chg: "-0.49%", dir: "down" },
  // Asia regional
  { sym: "HSI", val: "16,892", chg: "+1.18%", dir: "up" },
  { sym: "N225", val: "39,521", chg: "-0.34%", dir: "down" },
  { sym: "USDJPY", val: "152.18", chg: "+0.12%", dir: "up" },
  // US / Global
  { sym: "ES1!", val: "5,241.25", chg: "-0.42%", dir: "down" },
  { sym: "NQ1!", val: "18,310.50", chg: "-0.61%", dir: "down" },
  { sym: "DXY", val: "104.82", chg: "+0.31%", dir: "up" },
  { sym: "EURUSD", val: "1.0782", chg: "-0.18%", dir: "down" },
  // Crypto
  { sym: "BTC", val: "70,840", chg: "+0.18%", dir: "up" },
  { sym: "ETH", val: "3,612", chg: "-0.24%", dir: "down" },
  // Commodities
  { sym: "CL1!", val: "84.21", chg: "-0.94%", dir: "down" },
  { sym: "GC1!", val: "2,348", chg: "+0.42%", dir: "up" },
  // Bonds / vol
  { sym: "US10Y", val: "4.412", chg: "+3.2bp", dir: "up" },
  { sym: "VIX", val: "16.84", chg: "+4.21%", dir: "up" },
];
