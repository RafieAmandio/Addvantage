/**
 * Canonical source registry. `code` is the visible byline ([FRED], [SC], ...).
 * Worker adapters key off `code`. Admin UI reads names/urls for display.
 */
export const SOURCES = [
  {
    code: "FRED",
    name: "FRED — Federal Reserve Economic Data",
    url: "https://fred.stlouisfed.org",
    adapter: "fred",
    pollMinutes: 60,
  },
  {
    code: "SC",
    name: "SlickCharts — S&P 500 Constituents",
    url: "https://www.slickcharts.com/sp500",
    adapter: "slickcharts",
    pollMinutes: 60,
  },
  {
    code: "SPDJI",
    name: "S&P Dow Jones Indices",
    url: "https://www.spglobal.com/spdji",
    adapter: "spdji",
    pollMinutes: 60,
  },
  {
    code: "YRD",
    name: "Yardeni Research",
    url: "https://www.yardeni.com",
    adapter: "yardeni",
    pollMinutes: 60,
  },
  {
    code: "RBC",
    name: "RBC Wealth Management — Insights",
    url: "https://www.rbcwealthmanagement.com/en-asia/insights",
    adapter: "rbc",
    pollMinutes: 60,
  },
  {
    code: "TRUMP",
    name: "Donald Trump (Truth Social)",
    url: "https://trumpstruth.org/feed",
    adapter: "truth-social",
    pollMinutes: 60,
  },
  {
    code: "FF",
    name: "ForexFactory Economic Calendar",
    url: "https://nfs.faireconomy.media/ff_calendar_thisweek.xml",
    adapter: "forexfactory",
    pollMinutes: 360,
  },
] as const;

export type SourceCode = (typeof SOURCES)[number]["code"];

export const SOURCE_CODES = SOURCES.map((s) => s.code) as readonly SourceCode[];
