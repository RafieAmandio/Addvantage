"use client";

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
} from "@tradevantage/shared/schema";
import type { Bulletin } from "@/features/bulletin/types";

const INITIAL: BulletinActionState = { ok: false };

const inputClass =
  "w-full rounded-lg border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm text-white outline-none transition-colors placeholder:text-white/25 focus-visible:border-brand";
const labelClass =
  "block font-mono text-xs font-bold uppercase tracking-widest2 text-white/70";

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="rounded-lg bg-brand px-5 py-2.5 font-mono text-sm font-bold text-black transition-all hover:bg-brand-dim active:scale-[0.98] disabled:cursor-wait"
    >
      {pending ? "Saving…" : editing ? "Save changes" : "Create bulletin"}
    </button>
  );
}

export function BulletinEditorForm({ bulletin }: { bulletin: Bulletin | null }) {
  const action = bulletin ? updateBulletin.bind(null, bulletin.id) : createBulletin;
  const [state, formAction] = useFormState(action, INITIAL);
  const levelByTf = new Map(bulletin?.levels.map((l) => [l.timeframe, l]) ?? []);

  return (
    <div className="max-w-3xl">
      <form action={formAction} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="symbol" className={labelClass}>
              Symbol
            </label>
            <input
              id="symbol"
              name="symbol"
              required
              defaultValue={bulletin?.symbol ?? ""}
              placeholder="BTC"
              className={`${inputClass} mt-2`}
            />
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={bulletin?.status ?? "active"}
              className={`${inputClass} mt-2`}
            >
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
              defaultValue={bulletin?.bias ?? "neutral"}
              className={`${inputClass} mt-2`}
            >
              {MARKET_STRUCTURES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {(["whatToWatch", "entry", "exit"] as const).map((field) => (
            <div key={field}>
              <label htmlFor={field} className={labelClass}>
                {field === "whatToWatch" ? "What to watch" : field}
              </label>
              <textarea
                id={field}
                name={field}
                rows={3}
                defaultValue={bulletin?.[field] ?? ""}
                className={`${inputClass} mt-2 resize-y`}
              />
            </div>
          ))}
        </div>

        <div>
          <label htmlFor="note" className={labelClass}>
            Note (optional)
          </label>
          <textarea
            id="note"
            name="note"
            rows={2}
            defaultValue={bulletin?.note ?? ""}
            className={`${inputClass} mt-2 resize-y`}
          />
        </div>

        <div>
          <span className={labelClass}>Market structure by timeframe</span>
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-[3rem_1fr_1fr_2fr] gap-2 font-mono text-[9px] uppercase tracking-widest2 text-white/30">
              <span>TF</span>
              <span>Structure</span>
              <span>BoS level</span>
              <span>Comment</span>
            </div>
            {BULLETIN_TIMEFRAMES.map((tf) => {
              const lvl = levelByTf.get(tf);
              return (
                <div key={tf} className="grid grid-cols-[3rem_1fr_1fr_2fr] items-center gap-2">
                  <span className="font-mono text-xs text-white/60">{tf}</span>
                  <select
                    name={`ms_${tf}`}
                    defaultValue={lvl?.marketStructure ?? ""}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {MARKET_STRUCTURES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    name={`bos_${tf}`}
                    defaultValue={lvl?.bosLevel ?? ""}
                    placeholder="77300"
                    className={inputClass}
                  />
                  <input
                    name={`cmt_${tf}`}
                    defaultValue={lvl?.comment ?? ""}
                    placeholder="Comment"
                    className={inputClass}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {state.error && (
          <p className="font-mono text-xs text-red-400">{state.error}</p>
        )}
        {state.ok && <p className="font-mono text-xs text-moss">Saved.</p>}

        <SubmitButton editing={!!bulletin} />
      </form>

      {bulletin && (
        <form action={deleteBulletin.bind(null, bulletin.id)} className="mt-8 border-t border-white/[0.06] pt-6">
          <button
            type="submit"
            className="font-mono text-xs text-red-400/80 transition-colors hover:text-red-400"
          >
            Delete bulletin
          </button>
        </form>
      )}
    </div>
  );
}
