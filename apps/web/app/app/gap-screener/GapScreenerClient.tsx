"use client";

import { useMemo, useState } from "react";
import type { ForexTier } from "@tradevantage/shared";
import { formatWibTime } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { TextTabs } from "@/components/ui/TextTabs";
import { useGapData } from "@/features/gap-screener/hooks/useGapData";
import { GapTable } from "@/features/gap-screener/components/GapTable";
import { StateLine } from "@/features/atr/components/FilterControls";

const TIERS = [
  { id: "all", label: "All tiers" },
  { id: "primary", label: "Primary" },
  { id: "secondary", label: "Secondary" },
  { id: "thirdliner", label: "Thirdliner" },
] as const;
const STATUSES = [
  { id: "active", label: "Active" },
  { id: "filled", label: "Filled" },
  { id: "all", label: "All" },
] as const;

const RULES: [string, string][] = [
  ["Gap up", "Sell setup, target Friday close"],
  ["Gap down", "Buy setup, target Friday close"],
  ["Minimum gap", "0.3%"],
  ["Stop loss", "1.5x the gap size"],
];

export default function GapScreenerClient() {
  const [activeTier, setActiveTier] = useState<ForexTier | "all">("all");
  const [activeStatus, setActiveStatus] = useState<"all" | "active" | "filled">("active");

  const { data, loading, error } = useGapData();

  const filteredPairs = useMemo(() => {
    if (!data) return [];
    return data.pairs.filter(
      (p) => (activeTier === "all" || p.tier === activeTier) && (activeStatus === "all" || p.status === activeStatus),
    );
  }, [data, activeTier, activeStatus]);

  const pairs = data?.pairs ?? [];
  const totalCount = pairs.length;
  const stats: [string, number][] = [
    ["Active", pairs.filter((p) => p.status === "active").length],
    ["Filled", pairs.filter((p) => p.status === "filled").length],
    ["Total", totalCount],
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Panel
        title="Weekend gaps"
        sub={
          <>
            Gaps between Friday close and Monday open, largest first.
            {data?.updatedAt && <span className="text-white/30"> Updated {formatWibTime(data.updatedAt)} WIB</span>}
          </>
        }
        action={<TextTabs options={STATUSES} value={activeStatus} onChange={setActiveStatus} label="Status" />}
      >
        <TextTabs options={TIERS} value={activeTier} onChange={setActiveTier} label="Tier" className="mb-3" />
        {loading ? (
          <StateLine>Scanning weekend gaps</StateLine>
        ) : error ? (
          <StateLine>{error}</StateLine>
        ) : filteredPairs.length === 0 ? (
          <StateLine>{totalCount === 0 ? "No gaps detected this week. Check back next Monday." : "No gaps match the selected filters."}</StateLine>
        ) : (
          <>
            <GapTable pairs={filteredPairs} />
            <p className="mt-3 text-[12px] text-white/30">
              {filteredPairs.length} of {totalCount} gaps. Gap size in percent, fill is how much of the gap price has closed.
            </p>
          </>
        )}
      </Panel>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel title="This week">
          <dl className="grid grid-cols-3 gap-3">
            {stats.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">{k}</dt>
                <dd className={k === "Active" && v > 0 ? "font-num text-[34px] font-semibold leading-9 text-brand" : "font-num text-[34px] font-semibold leading-9 text-white"}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Rules" sub="Weekend gaps tend to fill back to Friday's close">
          <dl className="-my-1 divide-y divide-white/[0.07]">
            {RULES.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="text-[14px] text-white/55">{k}</dt>
                <dd className="text-right text-[14px] font-medium text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </aside>
    </div>
  );
}
