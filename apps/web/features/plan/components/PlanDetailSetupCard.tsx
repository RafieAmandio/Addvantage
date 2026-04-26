"use client";

import { DataLabel, BiasBadge } from "@/components/ui/Marker";
import { WatchPin } from "@/features/watchlist/components/WatchPin";
import { useToast } from "@/lib/toast";
import type { TradingSetup } from "@/features/plan/types";
import {
  OUTCOME_META,
  setupToText,
} from "@/features/plan/lib/detail-helpers";

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

  const copySetup = async () => {
    const text = setupToText(s, planId);
    try {
      await navigator.clipboard.writeText(text);
      toast.push({
        tone: "success",
        title: "Setup copied",
        description: `${s.id} · ${s.instrument} ${s.direction} · ready to paste`,
        duration: 2500,
      });
    } catch {
      toast.push({
        tone: "error",
        title: "Copy failed",
        description:
          "Browser denied clipboard access. Try selecting the text manually.",
      });
    }
  };

  const copySetupLink = async () => {
    const url = `${window.location.origin}/app/plan/${planId}#${s.id}`;
    try {
      await navigator.clipboard.writeText(url);
      if (window.location.hash !== `#${s.id}`) {
        window.history.pushState(null, "", `#${s.id}`);
      }
      toast.push({
        tone: "success",
        title: "Link copied",
        description: `${planId}#${s.id} · shareable deep link`,
        duration: 2500,
      });
    } catch {
      toast.push({
        tone: "error",
        title: "Copy failed",
        description: "Browser denied clipboard access.",
      });
    }
  };

  return (
    <div
      id={s.id}
      className="group/setup relative scroll-mt-24 border border-gray-3 bg-gray-2/30 p-5 transition-all hover:border-brand/40"
    >
      <div className="absolute right-3 top-3 z-10 flex gap-1 opacity-0 transition-opacity group-hover/setup:opacity-100">
        <button
          onClick={copySetupLink}
          title={`Copy deep link to ${s.id}`}
          aria-label={`Copy link to setup ${s.id}`}
          className="border border-gray-3 bg-gray-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/40 hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
        >
          ⌯ LINK
        </button>
        <button
          onClick={copySetup}
          title={`Copy ${s.id} as text`}
          aria-label={`Copy setup ${s.id} text`}
          className="border border-gray-3 bg-gray-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-white/40 hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
        >
          ⧉ TEXT
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          {s.id}
        </span>
        <div className="flex items-center gap-2 pr-24">
          <span
            className={
              "inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 " +
              meta.style
            }
          >
            <span className={`h-1.5 w-1.5 ${meta.dot}`} />
            {meta.label}
            {s.outcomeR && status !== "skipped" && (
              <span className="ml-1">· {s.outcomeR}</span>
            )}
          </span>
          <BiasBadge bias={s.bias} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-3">
        <h3 className="font-display text-3xl text-white">{s.instrument}</h3>
        <WatchPin ticker={s.instrument} size="md" />
        <span
          className={
            "font-mono text-sm uppercase tracking-widest2 " +
            (s.direction === "long" ? "text-moss" : "text-brand")
          }
        >
          {s.direction}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <Field label="Entry">{s.entry}</Field>
        <Field label="Stop" highlight>
          {s.stop}
        </Field>
        <Field label="Targets">
          <ol className="space-y-0.5">
            {s.targets.map((t, i) => (
              <li key={t} className="font-mono text-white">
                T{i + 1} · {t}
              </li>
            ))}
          </ol>
        </Field>
      </div>

      <div className="mt-4 border-t border-gray-3 pt-3">
        <DataLabel>Rationale</DataLabel>
        <p className="mt-1 text-sm text-white/70">{s.rationale}</p>
      </div>

      <div className="mt-4 border-t border-blood/40 pt-3">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-blood-bright">
          Invalidation
        </div>
        <p className="mt-1 text-sm text-white/80">{s.invalidation}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <DataLabel>Confidence</DataLabel>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={
                "h-2 w-4 " + (i <= s.confidence ? "bg-brand" : "bg-gray-3")
              }
            />
          ))}
        </div>
      </div>

      {s.outcomeNotes && (
        <div className="mt-4 border-t border-gray-3 pt-3">
          <div
            className={
              "font-mono text-[9px] uppercase tracking-widest2 " +
              (status === "win"
                ? "text-moss"
                : status === "loss" || status === "stopped"
                ? "text-blood-bright"
                : "text-white/60")
            }
          >
            Outcome · {meta.label}
          </div>
          <p className="mt-1 text-sm text-white/80">{s.outcomeNotes}</p>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "border-l-2 pl-3 " + (highlight ? "border-blood" : "border-white/20")
      }
    >
      <DataLabel>{label}</DataLabel>
      <div className="font-mono text-white">{children}</div>
    </div>
  );
}
