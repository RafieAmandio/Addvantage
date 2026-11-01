"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { saveTrade } from "../queries";
import { MISTAKES, SETUP_LABEL, manageTrade, plannedR, tradeR, type Trade } from "../lib/journal";
import { chip, fmtR, input, label, motion, primary, rCls, secondary, small, useBars, wibShort } from "./ui";

const toLocal = (ms: number) => new Date(ms - new Date(ms).getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
const sym = (s: string) => s.replace("/", "");

function Head({ t }: { t: Trade }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="font-num text-[19px] font-semibold leading-6 text-white">{sym(t.symbol)}</span>
      <span className={cn("text-[13px] font-semibold capitalize", t.side === "buy" ? "text-up" : "text-down")}>{t.side}</span>
      <span className="text-[13px] text-white/55">{SETUP_LABEL[t.setup]}</span>
      <span className="text-[12px] text-white/30">{t.timeframe === "other" ? "" : t.timeframe}</span>
    </div>
  );
}

function Prices({ t }: { t: Trade }) {
  const r = plannedR(t.entry, t.stop, t.target);
  return (
    <p className="text-[13px] text-white/55">
      <span className="font-num text-[15px] font-semibold text-white">{fmtPrice(t.entry)}</span> stop <span className="font-num text-[15px] font-semibold text-white/80">{fmtPrice(t.stop)}</span>
      {t.target !== null && (
        <>
          {" "}
          target <span className="font-num text-[15px] font-semibold text-white/80">{fmtPrice(t.target)}</span>
        </>
      )}
      <span className="text-white/40">
        {" "}
        · {t.riskPct}% risk{r !== null ? ` · ${r.toFixed(2)}R planned` : ""}
      </span>
    </p>
  );
}

function Manager({ t }: { t: Trade }) {
  const bars = useBars(t.symbol, t.openedAt);
  const m = useMemo(() => (bars ? manageTrade(t, bars.hourly) : null), [bars, t]);
  if (!bars) return <p className="text-[12px] text-white/30">Reading hourly candles</p>;
  if (!m) return <p className="text-[12px] text-white/30">No hourly candles since the entry yet</p>;
  return (
    <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] sm:grid-cols-4">
      <span>
        <span className="block text-white/40">Last close</span>
        <span className="font-num text-[15px] font-semibold text-white">{fmtPrice(m.last)}</span>
      </span>
      <span>
        <span className="block text-white/40">Evolving R</span>
        <span className={cn("font-num text-[15px] font-semibold", m.exit ? "text-down" : "text-white")}>{m.evolvingR === null ? "·" : m.evolvingR.toFixed(2)}</span>
      </span>
      <span>
        <span className="block text-white/40">Trail to</span>
        <span className="font-num text-[15px] font-semibold text-white">{m.trail === null ? "·" : fmtPrice(m.trail)}</span>
      </span>
      <span>
        <span className="block text-white/40">MAE so far</span>
        <span className="font-num text-[15px] font-semibold text-white">{m.maeR.toFixed(2)}R</span>
      </span>
      {m.past ? (
        <p className="col-span-full text-[13px] text-up">Price is through the target. Take it or trail it tight.</p>
      ) : (
        m.exit && <p className="col-span-full text-[13px] text-down">Evolving R under 0.2, the method says exit.</p>
      )}
      {m.trail !== null && !m.exit && <p className="col-span-full text-[12px] text-white/40">Trail behind the last hourly candle that closed through a swing.</p>}
    </div>
  );
}

function CloseForm({ t, onDone, onCancel }: { t: Trade; onDone: (t: Trade) => void; onCancel: () => void }) {
  const [exit, setExit] = useState("");
  const [at, setAt] = useState(() => toLocal(Date.now()));
  const [followed, setFollowed] = useState<boolean | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const x = exit.trim() === "" ? null : Number(exit);
  const r = x !== null && Number.isFinite(x) ? tradeR({ ...t, exit: x }) : null;

  async function save() {
    const closed = Date.parse(at);
    if (x === null || !Number.isFinite(x) || x <= 0) return setError("Enter the exit price.");
    if (followed === null) return setError("Did you follow the plan?");
    if (!Number.isFinite(closed) || closed < Date.parse(t.openedAt)) return setError("The close time is before the entry.");
    setBusy(true);
    try {
      const { id, createdAt: _c, updatedAt: _u, ...rest } = t;
      onDone(await saveTrade({ ...rest, status: "closed", exit: x, closedAt: new Date(closed).toISOString(), followedPlan: followed, mistakes: tags }, id));
    } catch {
      setError("Could not close the trade. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-raised/60 p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className={label}>Exit price</span>
          <input autoFocus className={cn(input, "bg-panel font-num text-[17px]")} inputMode="decimal" value={exit} onChange={(e) => setExit(e.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className={label}>Closed</span>
          <input type="datetime-local" className={cn(input, "bg-panel px-3 text-[14px] [color-scheme:dark]")} value={at} onChange={(e) => setAt(e.target.value)} />
        </label>
      </div>
      {r !== null && (
        <p className="text-[13px] text-white/55">
          Result <span className={cn("font-num text-[17px] font-semibold", rCls(r))}>{fmtR(r)}</span>
        </p>
      )}
      <div className="space-y-1.5">
        <span className={label}>Followed the plan?</span>
        <div className="flex gap-2">
          {([true, false] as const).map((v) => (
            <button key={String(v)} type="button" aria-pressed={followed === v} onClick={() => setFollowed(v)} className={chip(followed === v)}>
              {v ? "Yes" : "No, I broke a rule"}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <span className={label}>Demon Finder · tag what went wrong</span>
        <div className="flex flex-wrap gap-1.5">
          {MISTAKES.map((m) => (
            <button key={m} type="button" aria-pressed={tags.includes(m)} onClick={() => setTags((x) => (x.includes(m) ? x.filter((y) => y !== m) : [...x, m]))} className={chip(tags.includes(m))}>
              {m}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-[13px] text-down">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={() => void save()} className={primary}>
          Close trade
        </button>
        <button type="button" onClick={onCancel} className={secondary}>
          Cancel
        </button>
      </div>
    </div>
  );
}

interface RowProps {
  t: Trade;
  fresh: boolean;
  onEdit: (t: Trade) => void;
  onChange: (t: Trade) => void;
  onDelete: (t: Trade) => void;
}

export function ActiveRow({ t, fresh, onEdit, onChange, onDelete }: RowProps) {
  const [closing, setClosing] = useState(false);
  return (
    <li className={cn("py-4", fresh && motion.slideIn)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <Head t={t} />
          <Prices t={t} />
          <p className="text-[12px] text-white/40">
            {t.status === "planned" ? "Planned" : "Opened"} {wibShort(t.openedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {t.status === "open" && !closing && (
            <button type="button" onClick={() => setClosing(true)} className={small}>
              Close
            </button>
          )}
          <button type="button" onClick={() => onEdit(t)} className={small}>
            {t.status === "planned" ? "Open it" : "Edit"}
          </button>
          {t.status === "planned" && (
            <button
              type="button"
              onClick={async () => {
                const { id, createdAt: _c, updatedAt: _u, ...rest } = t;
                onChange(await saveTrade({ ...rest, status: "cancelled" }, id));
              }}
              className={small}
            >
              Cancel
            </button>
          )}
          <button type="button" onClick={() => onDelete(t)} className={cn(small, "text-white/40")}>
            Delete
          </button>
        </div>
      </div>
      {t.status === "open" && <Manager t={t} />}
      {closing && (
        <CloseForm
          t={t}
          onCancel={() => setClosing(false)}
          onDone={(x) => {
            setClosing(false);
            onChange(x);
          }}
        />
      )}
    </li>
  );
}

export function ClosedRow({ t, fresh, onEdit, onDelete }: Omit<RowProps, "onChange">) {
  const r = tradeR(t);
  return (
    <li className={cn("flex items-start gap-3 py-3.5", fresh && motion.slideIn)}>
      <div className="min-w-0 flex-1 space-y-0.5">
        <Head t={t} />
        <p className="text-[13px] text-white/55">
          <span className="font-num text-[15px] font-semibold text-white">{fmtPrice(t.entry)}</span> to{" "}
          <span className="font-num text-[15px] font-semibold text-white">{t.exit !== null ? fmtPrice(t.exit) : "·"}</span>
          <span className="text-white/40">
            {" "}
            · {t.riskPct}% risk · {t.closedAt ? wibShort(t.closedAt) : t.status}
          </span>
        </p>
        {(t.followedPlan === false || t.mistakes.length > 0) && (
          <div className="flex flex-wrap gap-1 pt-1">
            {t.followedPlan === false && <span className="rounded-full border border-down/40 px-2 py-px text-[11px] text-down">rule broken</span>}
            {t.mistakes.map((m) => (
              <span key={m} className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] text-white/60">
                {m}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {t.status === "cancelled" ? (
          <span className="text-[13px] text-white/30">Cancelled</span>
        ) : (
          r !== null && <span className={cn("font-num text-[22px] font-semibold leading-6", rCls(r))}>{fmtR(r)}</span>
        )}
        <span className="flex gap-1">
          <button type="button" onClick={() => onEdit(t)} className="rounded-full px-2 py-0.5 text-[12px] text-white/45 transition-colors duration-150 hover:bg-raised hover:text-white active:scale-[0.97]">
            Edit
          </button>
          <button type="button" onClick={() => onDelete(t)} className="rounded-full px-2 py-0.5 text-[12px] text-white/30 transition-colors duration-150 hover:bg-raised hover:text-down active:scale-[0.97]" aria-label="Delete trade">
            Delete
          </button>
        </span>
      </div>
    </li>
  );
}

