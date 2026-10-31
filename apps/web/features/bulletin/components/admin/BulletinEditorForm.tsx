"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  createBulletin,
  updateBulletin,
  deleteBulletin,
  type BulletinActionState,
} from "@/features/bulletin/admin/actions";
import {
  BULLETIN_TIMEFRAMES,
  MARKET_STRUCTURES,
  BULLETIN_STATUSES,
  type BulletinTimeframe,
  type MarketStructure,
} from "@tradevantage/shared/schema";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { BiasBadge } from "@/components/ui/Marker";
import { StructureStrip } from "@/features/bulletin/components/StructureStrip";
import type { Bulletin, BulletinLevel } from "@/features/bulletin/types";

const INITIAL: BulletinActionState = { ok: false };

const inputClass =
  "h-11 w-full rounded-xl bg-raised px-4 text-[15px] text-white outline-none ring-1 ring-white/[0.08] placeholder:text-white/25 focus-visible:ring-brand";
const textareaClass =
  "w-full resize-y rounded-xl bg-raised px-4 py-3 text-[15px] leading-[22px] text-white outline-none ring-1 ring-white/[0.08] placeholder:text-white/25 focus-visible:ring-brand";
const labelClass = "block text-[13px] font-medium text-white/70";
const eyebrow = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Saving" : editing ? "Save changes" : "Create bulletin"}
    </button>
  );
}

type Draft = { ms: MarketStructure | ""; bos: string };

export function BulletinEditorForm({ bulletin }: { bulletin: Bulletin | null }) {
  const action = bulletin ? updateBulletin.bind(null, bulletin.id) : createBulletin;
  const [state, formAction] = useFormState(action, INITIAL);
  const levelByTf = new Map(bulletin?.levels.map((l) => [l.timeframe, l]) ?? []);

  // Mirrors the per-timeframe inputs so the preview strip updates live; the inputs stay the form source.
  const [symbol, setSymbol] = useState(bulletin?.symbol ?? "");
  const [bias, setBias] = useState<MarketStructure>(bulletin?.bias ?? "neutral");
  const [drafts, setDrafts] = useState<Record<BulletinTimeframe, Draft>>(
    () =>
      Object.fromEntries(
        BULLETIN_TIMEFRAMES.map((tf) => {
          const l = levelByTf.get(tf);
          return [tf, { ms: l?.marketStructure ?? "", bos: l?.bosLevel ?? "" }];
        }),
      ) as Record<BulletinTimeframe, Draft>,
  );
  const setDraft = (tf: BulletinTimeframe, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [tf]: { ...d[tf], ...patch } }));

  const previewLevels: BulletinLevel[] = BULLETIN_TIMEFRAMES.flatMap((tf) => {
    const d = drafts[tf];
    if (!d.ms) return [];
    return [{ id: tf, timeframe: tf, marketStructure: d.ms, bosLevel: d.bos || null, comment: null, createdAt: "", updatedAt: "" }];
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form action={formAction} className="min-w-0 space-y-4">
        <Panel title="Instrument">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="symbol" className={labelClass}>
                Symbol
              </label>
              <input
                id="symbol"
                name="symbol"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="BTC"
                className={cn(inputClass, "mt-2 uppercase")}
              />
            </div>
            <div>
              <label htmlFor="status" className={labelClass}>
                Status
              </label>
              <select id="status" name="status" defaultValue={bulletin?.status ?? "active"} className={cn(inputClass, "mt-2")}>
                {BULLETIN_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === "active" ? "Active (looked at)" : "Watching"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bias" className={labelClass}>
                Overall bias
              </label>
              <select
                id="bias"
                name="bias"
                value={bias}
                onChange={(e) => setBias(e.target.value as MarketStructure)}
                className={cn(inputClass, "mt-2")}
              >
                {MARKET_STRUCTURES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {(["whatToWatch", "entry", "exit"] as const).map((field) => (
              <div key={field}>
                <label htmlFor={field} className={labelClass}>
                  {field === "whatToWatch" ? "What to watch" : field === "entry" ? "Entry" : "Exit"}
                </label>
                <textarea id={field} name={field} rows={3} defaultValue={bulletin?.[field] ?? ""} className={cn(textareaClass, "mt-2")} />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label htmlFor="note" className={labelClass}>
              Note (optional)
            </label>
            <textarea id="note" name="note" rows={2} defaultValue={bulletin?.note ?? ""} className={cn(textareaClass, "mt-2")} />
          </div>
        </Panel>

        <Panel title="Market structure by timeframe" sub="Leave structure empty to skip a timeframe.">
          <div className="hidden grid-cols-[3rem_1fr_1fr_2fr] gap-2 pb-2 sm:grid">
            <span className={eyebrow}>TF</span>
            <span className={eyebrow}>Structure</span>
            <span className={eyebrow}>BoS level</span>
            <span className={eyebrow}>Comment</span>
          </div>
          <div className="divide-y divide-white/[0.07]">
            {BULLETIN_TIMEFRAMES.map((tf) => {
              const lvl = levelByTf.get(tf);
              const ms = drafts[tf].ms;
              return (
                <div key={tf} className="grid grid-cols-[3rem_1fr_1fr] items-center gap-2 py-2.5 sm:grid-cols-[3rem_1fr_1fr_2fr]">
                  <span
                    className={cn(
                      "font-num text-[17px] font-semibold",
                      ms === "bullish" ? "text-up" : ms === "bearish" ? "text-down" : "text-white/55",
                    )}
                  >
                    {tf}
                  </span>
                  <select
                    name={`ms_${tf}`}
                    aria-label={`${tf} structure`}
                    value={ms}
                    onChange={(e) => setDraft(tf, { ms: e.target.value as Draft["ms"] })}
                    className={inputClass}
                  >
                    <option value="">None</option>
                    {MARKET_STRUCTURES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    name={`bos_${tf}`}
                    aria-label={`${tf} BoS level`}
                    value={drafts[tf].bos}
                    onChange={(e) => setDraft(tf, { bos: e.target.value })}
                    placeholder="77300"
                    className={cn(inputClass, "font-num text-[17px]")}
                  />
                  <input
                    name={`cmt_${tf}`}
                    aria-label={`${tf} comment`}
                    defaultValue={lvl?.comment ?? ""}
                    placeholder="Comment"
                    className={cn(inputClass, "col-span-3 col-start-1 sm:col-span-1 sm:col-start-auto")}
                  />
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {state.error && <p className="mr-auto text-[13px] text-down">{state.error}</p>}
          {state.ok && <p className="mr-auto text-[13px] text-up">Saved.</p>}
          <SubmitButton editing={!!bulletin} />
        </div>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel title="Preview" sub="How the board row reads.">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="font-num text-[28px] font-semibold uppercase leading-none text-white">{symbol || "Symbol"}</span>
            <BiasBadge bias={bias} />
          </div>
          <StructureStrip levels={previewLevels} size={26} />
        </Panel>
        {bulletin && (
          <Panel title="Remove from board" sub="Deletes the instrument and its levels.">
            <form action={deleteBulletin.bind(null, bulletin.id)}>
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-full border border-white/[0.14] text-[14px] font-medium text-down transition-colors hover:bg-raised"
              >
                Delete bulletin
              </button>
            </form>
          </Panel>
        )}
      </aside>
    </div>
  );
}
