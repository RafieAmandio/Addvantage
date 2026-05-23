"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import { apiGet } from "@/lib/api/client";
import { formatVolume, categoryIcon } from "../lib/format";
import { ProbabilityChart } from "./ProbabilityChart";
import { OutcomeRow } from "./OutcomeRow";
import type { PredictionCardData, PriceHistoryPoint } from "../types";

export function PredictionModal({
  data,
  onClose,
}: {
  data: PredictionCardData;
  onClose: () => void;
}) {
  const { tracked, outcomes, volume, liquidity, marketCount } = data;
  const [history, setHistory] = useState<PriceHistoryPoint[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState(0);
  const [selectedInterval, setSelectedInterval] = useState<"1d" | "1w" | "1m" | "max">("1m");

  const topOutcome = outcomes[selectedOutcome];
  const tokenId = topOutcome?.tokenId;

  const fetchHistory = useCallback(async () => {
    if (!tokenId) return;
    setHistoryLoading(true);
    try {
      const res = await apiGet<{ history: PriceHistoryPoint[] }>(
        `/predictions/history?tokenId=${encodeURIComponent(tokenId)}&interval=${selectedInterval}`,
      );
      setHistory(res.history);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [tokenId, selectedInterval]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const polymarketUrl = `https://polymarket.com/event/${tracked.eventSlug}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={tracked.eventTitle}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-xl overflow-hidden border border-white/[0.08] bg-black-2">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center bg-white/[0.06] font-mono text-[10px] text-brand">
                  {categoryIcon(tracked.category)}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest2 text-white/40">
                  {tracked.label}
                </span>
              </div>
              <h2 className="text-base font-semibold text-white">
                {tracked.eventTitle}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1 text-white/40 transition-colors hover:text-white"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          <div className="border-b border-white/[0.04] px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest2 text-white/40">
                Probability History
              </p>
              <div className="flex gap-1">
                {(["1d", "1w", "1m", "max"] as const).map((iv) => (
                  <button
                    key={iv}
                    onClick={() => setSelectedInterval(iv)}
                    className={cn(
                      "px-2 py-0.5 font-mono text-[10px] uppercase transition-colors",
                      selectedInterval === iv
                        ? "bg-brand/10 text-brand"
                        : "text-white/30 hover:text-white/50",
                    )}
                  >
                    {iv}
                  </button>
                ))}
              </div>
            </div>

            {historyLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-4 w-1 bg-brand/40"
                      style={{
                        animation: `loadbar 0.8s ${i * 0.15}s ease-in-out infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <ProbabilityChart
                data={history ?? []}
                label={topOutcome?.label}
              />
            )}

            {outcomes.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {outcomes.slice(0, 6).map((o, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedOutcome(i);
                      setHistory(null);
                    }}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-mono transition-colors border",
                      selectedOutcome === i
                        ? "border-brand/30 bg-brand/10 text-brand"
                        : "border-white/[0.06] text-white/40 hover:text-white/60",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest2 text-white/40">
              All Outcomes
            </p>
            <div className="space-y-2">
              {outcomes.map((o, i) => (
                <OutcomeRow key={i} outcome={o} />
              ))}
            </div>
          </div>

          <div className="border-t border-white/[0.06] px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-6 font-mono text-[10px] text-white/30">
                <span>{formatVolume(volume)} volume</span>
                {liquidity !== null && <span>{formatVolume(liquidity)} liquidity</span>}
                <span>{marketCount} markets</span>
              </div>
              <a
                href={polymarketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-brand transition-colors hover:text-brand-dim"
              >
                View on Polymarket
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-60">
                  <path d="M4.5 3H9V7.5M9 3L3 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
