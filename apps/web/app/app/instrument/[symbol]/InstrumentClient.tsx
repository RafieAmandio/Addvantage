"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api/client";
import { TradingViewChart } from "@/features/instrument/components/TradingViewChart";
import { RsiGauge } from "@/features/instrument/components/RsiGauge";
import { NewsList } from "@/features/instrument/components/NewsList";
import { GROUP_LABELS } from "@/features/heatmap/lib/zones";

interface RsiDetail {
  symbol: string;
  label: string;
  group: string;
  price: number | null;
  intervals: Record<string, { rsi: number; zone: string; ts: string }>;
}

interface NewsItem {
  id: string;
  sourceCode: string;
  headline: string;
  impact: string;
  bias: string;
  publishedAt: string | null;
  fetchedAt: string;
}

export default function InstrumentClient({ symbol }: { symbol: string }) {
  const [rsi, setRsi] = useState<RsiDetail | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      try {
        const [rsiData, newsData] = await Promise.all([
          apiGet<RsiDetail>(`/rsi/detail/${encodeURIComponent(symbol)}`),
          apiGet<{ content: NewsItem[] }>(`/news?affects=${encodeURIComponent(symbol)}&limit=10`).catch(() => ({ content: [] })),
        ]);
        if (!cancelled) {
          setRsi(rsiData);
          setNews(newsData.content ?? []);
        }
      } catch {
        // fail silently — RSI data may not exist for all symbols
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-brand">
          <span className="led" aria-hidden />
          Acquiring signal // {symbol.replace("/", "")}
        </div>
      </div>
    );
  }

  const sectionStyle = (delay: number) => ({
    opacity: 0,
    animation: `rsi-dot-in 0.5s ease-out ${delay}ms forwards`,
  });

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/[0.06] px-4 py-6 sm:px-6" style={sectionStyle(0)}>
        <Link
          href="/app/heatmap"
          className="mb-3 inline-flex items-center gap-1 text-xs text-white/30 transition-colors hover:text-white/60"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 3L4 7l5 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          RSI Heatmap
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-xl font-bold text-white">
            {rsi?.symbol ?? symbol}
          </h1>
          {rsi && (
            <>
              <span className="text-sm text-white/40">{rsi.label}</span>
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium uppercase text-brand">
                {GROUP_LABELS[rsi.group] ?? rsi.group}
              </span>
            </>
          )}
        </div>
        {rsi?.price !== null && rsi?.price !== undefined && (
          <div className="mt-1 font-mono text-lg text-white/60">
            {rsi.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
          </div>
        )}
      </div>

      <div className="border-b border-white/[0.06] p-4 sm:p-6" style={sectionStyle(100)}>
        <TradingViewChart symbol={symbol} height={600} />
      </div>

      <div className="border-b border-white/[0.06] px-4 py-6 sm:px-6" style={sectionStyle(200)}>
        <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-wider text-white/25">
          RSI (14 Period)
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <RsiGauge label="1 Hour" rsi={rsi?.intervals["1h"]?.rsi ?? null} />
          <RsiGauge label="4 Hour" rsi={rsi?.intervals["4h"]?.rsi ?? null} />
          <RsiGauge label="1 Day" rsi={rsi?.intervals["1d"]?.rsi ?? null} />
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6" style={sectionStyle(300)}>
        <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-wider text-white/25">
          Related News {news.length > 0 && <span className="text-white/10">({news.length})</span>}
        </h2>
        <NewsList items={news} />
      </div>
    </div>
  );
}
