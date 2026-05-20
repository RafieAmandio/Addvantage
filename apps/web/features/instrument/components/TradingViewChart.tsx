"use client";

import { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol: string;
  height?: number;
}

const SYMBOL_MAP: Record<string, string> = {
  "XAU/USD": "TVC:GOLD",
  "XAG/USD": "TVC:SILVER",
  "XAU/EUR": "FX:XAUEUR",
  "WTI/USD": "TVC:USOIL",
  "SPX": "SP:SPX500",
  "NDX": "NASDAQ:NDX",
  "DJI": "DJ:DJI",
  "DXY": "TVC:DXY",
  "FTSE": "TVC:UKX",
  "DAX": "XETR:DAX",
};

function toTvSymbol(symbol: string): string {
  if (SYMBOL_MAP[symbol]) return SYMBOL_MAP[symbol];
  if (symbol.includes("/")) return `FX:${symbol.replace("/", "")}`;
  return symbol;
}

export function TradingViewChart({ symbol, height = 400 }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.innerHTML = "";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = `${height}px`;
    widgetDiv.style.width = "100%";
    el.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text/javascript";
    script.textContent = JSON.stringify({
      autosize: true,
      symbol: toTvSymbol(symbol),
      interval: "60",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(17, 17, 17, 1)",
      gridColor: "rgba(255, 255, 255, 0.04)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: true,
      support_host: "https://www.tradingview.com",
    });
    el.appendChild(script);

    return () => {
      el.innerHTML = "";
    };
  }, [symbol]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container overflow-hidden rounded-lg border border-white/[0.06]"
      style={{ height }}
    />
  );
}
