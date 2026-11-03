"use client";

import { cn } from "@/lib/cn";
import { BiasBadge } from "@/components/ui/Marker";
import { WatchPin } from "@/features/watchlist/components/WatchPin";
import { useToast } from "@/lib/toast";
import type { TradingSetup } from "@/features/plan/types";
import {
  OUTCOME_META,
  riskReward,
  setupToText,
  splitLevel,
} from "@/features/plan/lib/detail-helpers";

const EYEBROW = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";

/** One setup as a row: direction, levels as big figures, R:R, invalidation and rationale. */
export function PlanDetailSetupCard({
  setup: s,
  planId,
  isLatest,
}: {
  setup: TradingSetup;
  planId: string;
  isLatest?: boolean;
}) {
  const toast = useToast();
  const status = s.outcome ?? (isLatest ? "live" : "open");
  const meta = OUTCOME_META[status];
  const long = s.direction === "long";
  const rr = riskReward(s);

  const copy = async (text: string, title: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.push({ tone: "success", title, description, duration: 2500 });
    } catch {
      toast.push({ tone: "error", title: "Copy failed", description: "Browser denied clipboard access." });
    }
  };

  const copySetupLink = () => {
    const url = `${window.location.origin}/app/plan/${planId}#${s.id}`;
    if (window.location.hash !== `#${s.id}`) window.history.pushState(null, "", `#${s.id}`);
    return copy(url, "Link copied", `${planId}#${s.id} · shareable deep link`);
  };

  return (
    <div id={s.id} className="scroll-mt-24 rounded-lg py-5 first:pt-1 last:pb-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={cn("text-[13px] font-semibold", long ? "text-up" : "text-down")}>
          {long ? "▲ Long" : "▼ Short"}
        </span>
        <h3 className="text-[20px] font-semibold leading-6 text-white">{s.instrument}</h3>
        <WatchPin ticker={s.instrument} />
        <BiasBadge bias={s.bias} />
        <span className="text-[12px] text-white/30">{s.id}</span>
        <span className="ml-auto flex items-baseline gap-2">
          <span className={cn("text-[12px] font-semibold uppercase tracking-[0.06em]", meta.tone)}>{meta.label}</span>
          {s.outcomeR && status !== "skipped" && (
            <span className={cn("font-num text-[22px] font-semibold leading-none", meta.tone)}>{s.outcomeR}</span>
          )}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <Level label="Entry" raw={s.entry} />
        <Level label="Stop" raw={s.stop} tone="text-down" />
        <div className="min-w-0">
          <dt className={EYEBROW}>Targets</dt>
          <dd className="mt-1 space-y-0.5">
            {s.targets.map((t, i) => {
              const { figure, note } = splitLevel(t);
              return (
                <div key={`${t}-${i}`} className="flex items-baseline gap-2">
                  <span className="text-[11px] text-white/30">T{i + 1}</span>
                  <span className="font-num text-[24px] font-semibold leading-7 text-up">{figure || note}</span>
                  {figure && note && <span className="truncate text-[12px] text-white/40">{note}</span>}
                </div>
              );
            })}
          </dd>
        </div>
        <div>
          <dt className={EYEBROW}>R:R to T1</dt>
          <dd className="mt-1 font-num text-[32px] font-semibold leading-9 text-white">{rr ?? "n/a"}</dd>
          <dd className="mt-1 flex gap-1" title={`Confidence ${s.confidence} of 5`} aria-label={`Confidence ${s.confidence} of 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={cn("h-1.5 w-1.5", i <= s.confidence ? "bg-brand" : "bg-white/15")} />
            ))}
          </dd>
        </div>
      </dl>

      {s.imageUrl && (
        <a href={s.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block">
          <img
            src={s.imageUrl}
            alt={`Chart: ${s.instrument}`}
            className="max-h-[400px] w-full rounded-xl bg-raised object-contain"
          />
        </a>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className={cn(EYEBROW, "text-down/80")}>Invalidation</p>
          <p className="mt-1 whitespace-pre-wrap text-[14px] leading-[21px] text-white/90">{s.invalidation}</p>
        </div>
        <div>
          <p className={EYEBROW}>Rationale</p>
          <p className="mt-1 whitespace-pre-wrap text-[14px] leading-[21px] text-white/55">{s.rationale}</p>
        </div>
      </div>

      {s.outcomeNotes && (
        <p className="mt-3 text-[14px] leading-[21px] text-white/55">
          <span className={cn("font-semibold", meta.tone)}>{meta.label}. </span>
          {s.outcomeNotes}
        </p>
      )}

      <div className="mt-3 flex gap-4 text-[12px] text-white/30">
        <button
          onClick={copySetupLink}
          aria-label={`Copy link to setup ${s.id}`}
          className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        >
          Copy link
        </button>
        <button
          onClick={() => copy(setupToText(s, planId), "Setup copied", `${s.id} · ${s.instrument} ${s.direction} · ready to paste`)}
          aria-label={`Copy setup ${s.id} text`}
          className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        >
          Copy as text
        </button>
      </div>
    </div>
  );
}

function Level({ label, raw, tone = "text-white" }: { label: string; raw: string; tone?: string }) {
  const { figure, note } = splitLevel(raw);
  return (
    <div className="min-w-0">
      <dt className={EYEBROW}>{label}</dt>
      {figure ? (
        <dd
          className={cn(
            "mt-1 whitespace-nowrap font-num font-semibold",
            figure.length > 9 ? "text-[26px] leading-9" : "text-[32px] leading-9",
            tone,
          )}
        >
          {figure}
        </dd>
      ) : (
        <dd className="mt-1 text-[15px] leading-[22px] text-white/90">{note || "n/a"}</dd>
      )}
      {figure && note && <dd className="text-[12px] leading-4 text-white/40">{note}</dd>}
    </div>
  );
}
