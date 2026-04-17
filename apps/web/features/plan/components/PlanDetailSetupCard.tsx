"use client";

import { DataLabel, BiasBadge } from "@/components/ui/Marker";
import { WatchPin } from "@/features/watchlist/components/WatchPin";
import { useToast } from "@/lib/toast";
import type { TradingSetup } from "@/lib/mock/types";
import {
  OUTCOME_META,
  setupToText,
} from "@/features/plan/lib/detail-helpers";

/**
 * Full per-setup card on the plan detail page — entry/stop/targets, rationale,
 * invalidation, confidence bar, outcome notes, plus "copy link" and "copy
 * text" actions. Extracted from `PlanDetail.tsx`.
 */
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
      // Push the hash into browser history so back/forward navigates
      // between anchored setups. Use pushState (not replaceState) so each
      // copied anchor becomes a real history entry.
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
      className="group/setup relative scroll-mt-24 border border-ink-3 bg-ink-2/30 p-5 transition-all hover:border-lime/40"
    >
      <div className="absolute right-3 top-3 z-10 flex gap-1 opacity-0 transition-opacity group-hover/setup:opacity-100">
        <button
          onClick={copySetupLink}
          title={`Copy deep link to ${s.id}`}
          aria-label={`Copy link to setup ${s.id}`}
          className="border border-ink-3 bg-ink-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/40 hover:border-lime hover:text-lime"
        >
          ⌯ LINK
        </button>
        <button
          onClick={copySetup}
          title={`Copy ${s.id} as text`}
          aria-label={`Copy setup ${s.id} text`}
          className="border border-ink-3 bg-ink-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-paper/40 hover:border-lime hover:text-lime"
        >
          ⧉ TEXT
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-lime">
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
        <h3 className="font-display text-3xl text-paper">{s.instrument}</h3>
        <WatchPin ticker={s.instrument} size="md" />
        <span
          className={
            "font-mono text-sm uppercase tracking-widest2 " +
            (s.direction === "long" ? "text-moss" : "text-lime")
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
              <li key={t} className="font-mono text-paper">
                T{i + 1} · {t}
              </li>
            ))}
          </ol>
        </Field>
      </div>

      <div className="mt-4 border-t border-ink-3 pt-3">
        <DataLabel>Rationale</DataLabel>
        <p className="mt-1 text-sm text-paper/70">{s.rationale}</p>
      </div>

      <div className="mt-4 border-t border-blood/40 pt-3">
        <div className="font-mono text-[9px] uppercase tracking-widest2 text-blood">
          Invalidation
        </div>
        <p className="mt-1 text-sm text-paper/80">{s.invalidation}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <DataLabel>Confidence</DataLabel>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={
                "h-2 w-4 " + (i <= s.confidence ? "bg-lime" : "bg-ink-3")
              }
            />
          ))}
        </div>
      </div>

      {s.outcomeNotes && (
        <div className="mt-4 border-t border-ink-3 pt-3">
          <div
            className={
              "font-mono text-[9px] uppercase tracking-widest2 " +
              (status === "win"
                ? "text-moss"
                : status === "loss" || status === "stopped"
                ? "text-blood"
                : "text-paper/60")
            }
          >
            Outcome · {meta.label}
          </div>
          <p className="mt-1 text-sm text-paper/80">{s.outcomeNotes}</p>
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
        "border-l-2 pl-3 " + (highlight ? "border-blood" : "border-paper/20")
      }
    >
      <DataLabel>{label}</DataLabel>
      <div className="font-mono text-paper">{children}</div>
    </div>
  );
}
