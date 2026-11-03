"use client";

import { useEffect, useMemo, useState } from "react";
import { FOREX_PAIRS } from "@tradevantage/shared";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/Panel";
import { fmtPrice } from "@/features/dashboard/components/PriceStrip";
import { saveTrade, type TradeInput } from "../queries";
import {
  MAX_RISK, SETUPS, SETUP_LABEL, TIMEFRAMES, checkPlan, killList, plannedR, positionSize, readMarket, riskTier,
  type NewsEvent, type Setup, type Side, type Status, type Trade, type TraderSettings,
} from "../lib/journal";
import { Checklist, Num, eyebrow, input, label, money, motion, primary, secondary, useBars, useChanges } from "./ui";

const toLocal = (ms: number) => new Date(ms - new Date(ms).getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
const num = (v: string) => (v.trim() === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const str = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));

interface Props {
  settings: TraderSettings;
  trades: Trade[];
  events: NewsEvent[];
  editing: Trade | null;
  onSaved: (t: Trade) => void;
  onCancel: () => void;
}

export function TradeForm({ settings, trades, events, editing, onSaved, onCancel }: Props) {
  const [symbol, setSymbol] = useState("EUR/USD");
  const [side, setSide] = useState<Side>("buy");
  const [setup, setSetup] = useState<Setup>("inverse-level");
  const [timeframe, setTimeframe] = useState<Trade["timeframe"]>("1H");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [target, setTarget] = useState("");
  const [risk, setRisk] = useState(String(riskTier("inverse-level")));
  const [openedAt, setOpenedAt] = useState(() => toLocal(Date.now()));
  const [notes, setNotes] = useState("");
  const [shot, setShot] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakes, setShakes] = useState(0);

  useEffect(() => {
    if (!editing) return;
    setSymbol(editing.symbol);
    setSide(editing.side);
    setSetup(editing.setup);
    setTimeframe(editing.timeframe);
    setEntry(str(editing.entry));
    setStop(str(editing.stop));
    setTarget(str(editing.target));
    setRisk(str(editing.riskPct));
    setOpenedAt(toLocal(Date.parse(editing.openedAt)));
    setNotes(editing.notes);
    setShot(editing.screenshotUrl ?? "");
  }, [editing]);

  const bars = useBars(symbol);
  const market = useMemo(() => (bars ? readMarket(bars.daily, bars.hourly) : { daily: null, levels: [], price: null }), [bars]);
  const plan = { symbol, side, setup, entry: num(entry), stop: num(stop), target: num(target), riskPct: num(risk) ?? 0 };
  const rules = checkPlan(plan, market);
  const r = plan.entry !== null && plan.stop !== null ? plannedR(plan.entry, plan.stop, plan.target) : null;
  const size = plan.entry !== null && plan.stop !== null ? positionSize(settings.equity, plan.riskPct, plan.entry, plan.stop, symbol, settings.currency) : null;

  const opened = Date.parse(openedAt);
  // A trade logged after the fact is history, not a new trade: the kill list only guards new ones.
  const past = Number.isFinite(opened) && opened < Date.now() - 3_600_000;
  const alreadyOpen = editing?.status === "open";
  const guard = killList({ symbol, side, setup, trades, events, equity: settings.equity, price: market.price, atr: market.daily?.atr ?? null, editingId: editing?.id });
  const blocked = !past && !alreadyOpen && guard.blocks.length > 0;
  const wrongSide = rules[0]!.met === false;
  const missing = plan.entry === null || plan.stop === null;
  const overCap = plan.riskPct > MAX_RISK || plan.riskPct <= 0;
  const shakeKey = useChanges(shakes);

  async function submit(status: Status) {
    if (status === "open" && blocked) {
      setShakes((n) => n + 1);
      setError(`Blocked: ${guard.blocks[0]!.rule.toLowerCase()}. Save it as planned instead.`);
      return;
    }
    if (missing || wrongSide || overCap || !Number.isFinite(opened)) {
      setError(missing ? "Entry and stop are required." : wrongSide ? "The stop is on the wrong side of the entry." : overCap ? `Risk must be above 0 and at most ${MAX_RISK}%.` : "Pick when the trade was opened.");
      return;
    }
    setBusy(true);
    setError(null);
    const body: TradeInput = {
      symbol,
      side,
      setup,
      timeframe,
      status: editing && status !== "open" && editing.status === "closed" ? "closed" : status,
      entry: plan.entry!,
      stop: plan.stop!,
      target: plan.target,
      exit: editing?.exit ?? null,
      size: size?.units ?? null,
      riskPct: plan.riskPct,
      openedAt: new Date(opened).toISOString(),
      closedAt: editing?.closedAt ?? null,
      followedPlan: editing?.followedPlan ?? null,
      mistakes: editing?.mistakes ?? [],
      notes: notes.trim(),
      screenshotUrl: shot.trim() || null,
    };
    try {
      const t = await saveTrade(body, editing?.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 1000);
      onSaved(t);
      if (!editing) {
        setEntry("");
        setStop("");
        setTarget("");
        setNotes("");
        setShot("");
        setOpenedAt(toLocal(Date.now()));
      }
    } catch {
      setError("Could not save the trade. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const sym = (s: string) => s.replace("/", "");
  return (
    <Panel
      title={editing ? `Edit ${sym(editing.symbol)} ${editing.side}` : "Check my plan"}
      sub={editing ? "Change the plan, then save it" : "Type the plan. The rules check it as you go."}
      action={editing ? <button type="button" onClick={onCancel} className="rounded-full px-2.5 py-1 text-[13px] font-medium text-white/55 transition-colors hover:bg-raised hover:text-white">New trade</button> : undefined}
    >
      {(guard.blocks.length > 0 || guard.warns.length > 0) && !past && !alreadyOpen && (
        <div className="mb-4">
          <p className={cn(eyebrow, guard.blocks.length ? "text-down" : "text-brand")}>{guard.blocks.length ? "Kill list · no new trades" : "Kill list · heads up"}</p>
          <ul className="mt-1 divide-y divide-white/[0.07]">
            {[...guard.blocks.map((b) => ({ ...b, block: true })), ...guard.warns.map((w) => ({ ...w, block: false }))].map((g) => (
              <li key={g.rule + g.evidence} className="flex gap-2 py-2 text-[13px] leading-[18px]">
                <span className={cn("w-4 shrink-0 font-semibold", g.block ? "text-down" : "text-brand")}>{g.block ? "✕" : "!"}</span>
                <span className="min-w-0">
                  <span className="block text-white">{g.rule}</span>
                  <span className="block text-white/45">{g.evidence}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(alreadyOpen ? "open" : editing?.status ?? "open");
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className={label}>Market</span>
            <select className={input} value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              {FOREX_PAIRS.map((p) => (
                <option key={p.symbol} value={p.symbol}>
                  {sym(p.symbol)}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-1.5">
            <span className={label}>Side</span>
            <div className="grid h-11 grid-cols-2 gap-1 rounded-xl bg-raised p-1 ring-1 ring-white/[0.08]" role="group" aria-label="Side">
              {(["buy", "sell"] as const).map((x) => (
                <button
                  key={x}
                  type="button"
                  aria-pressed={side === x}
                  onClick={() => setSide(x)}
                  className={cn(
                    "rounded-lg text-[14px] font-semibold capitalize transition-[background-color,color,transform] duration-150 active:scale-[0.97]",
                    side === x ? (x === "buy" ? "bg-up text-black" : "bg-down text-black") : "text-white/40 hover:text-white",
                  )}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
          <label className="block space-y-1.5">
            <span className={label}>Setup</span>
            <select
              className={input}
              value={setup}
              onChange={(e) => {
                const s = e.target.value as Setup;
                setSetup(s);
                setRisk(String(riskTier(s)));
              }}
            >
              {SETUPS.map((s) => (
                <option key={s} value={s}>
                  {SETUP_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className={label}>Timeframe</span>
            <select className={input} value={timeframe} onChange={(e) => setTimeframe(e.target.value as Trade["timeframe"])}>
              {TIMEFRAMES.map((t) => (
                <option key={t} value={t}>
                  {t === "other" ? "Other" : t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ["Entry", entry, setEntry],
              ["Stop", stop, setStop],
              ["Target", target, setTarget],
            ] as const
          ).map(([name, v, set]) => (
            <label key={name} className="block min-w-0 space-y-1.5">
              <span className={label}>{name}</span>
              <input className={cn(input, "px-3 font-num text-[17px]")} inputMode="decimal" placeholder={market.price !== null ? fmtPrice(market.price).replace(/,/g, "") : "0.00000"} value={v} onChange={(e) => set(e.target.value)} />
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className={label}>Risk %</span>
            <input className={cn(input, "font-num text-[17px]")} inputMode="decimal" value={risk} onChange={(e) => setRisk(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className={label}>Opened</span>
            <input type="datetime-local" className={cn(input, "px-3 text-[14px] [color-scheme:dark]")} value={openedAt} onChange={(e) => setOpenedAt(e.target.value)} />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-xl bg-raised px-4 py-3">
          <div className="min-w-0">
            <p className={eyebrow}>R</p>
            <Num value={r === null ? "·" : r.toFixed(2)} className={cn("text-[24px] leading-7", r === null ? "text-white/30" : r >= 1 ? "text-white" : r >= 0.5 ? "text-brand" : "text-down")} />
          </div>
          <div className="min-w-0">
            <p className={eyebrow}>{size?.lots !== null && size ? "Lots" : "Units"}</p>
            <Num value={size ? (size.lots !== null ? size.lots.toFixed(2) : size.units.toLocaleString("en-US", { maximumFractionDigits: 2 })) : "·"} className={cn("text-[24px] leading-7", size ? "text-white" : "text-white/30")} />
          </div>
          <div className="min-w-0">
            <p className={eyebrow}>At risk</p>
            <Num value={size ? money(size.money, settings.currency) : "·"} className={cn("block truncate text-[18px] leading-7", size ? "text-white" : "text-white/30")} />
          </div>
          {size && (
            <p className="col-span-3 text-[12px] leading-[17px] text-white/40">
              {size.units.toLocaleString("en-US", { maximumFractionDigits: 2 })} units
              {size.note ? `. ${size.note}` : ""}
            </p>
          )}
        </div>

        <div>
          <p className={eyebrow}>
            Rules · <span className={rules.every((x) => x.met) ? "text-brand" : "text-white/55"}>{rules.every((x) => x.met) ? "Every rule holds" : `${rules.filter((x) => x.met).length} of ${rules.length} hold`}</span>
          </p>
          <div className="mt-1">
            <Checklist rules={rules} />
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className={label}>Notes</span>
          <textarea className={cn(input, "h-auto py-3")} rows={2} placeholder="Why this level, what would make you wrong" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className={label}>Screenshot link</span>
          <input className={input} type="url" placeholder="https://" value={shot} onChange={(e) => setShot(e.target.value)} />
        </label>

        {error && <p className="text-[13px] text-down">{error}</p>}
        {past && !editing && <p className="text-[12px] text-white/40">Logging a past trade. The kill list only checks new trades.</p>}

        <div className="flex flex-wrap gap-2 pt-1">
          {alreadyOpen || editing?.status === "closed" ? (
            <button type="submit" disabled={busy} className={primary}>
              {saved ? "✓ Saved" : "Save changes"}
            </button>
          ) : (
            <>
              <button
                key={shakeKey}
                type="button"
                disabled={busy}
                onClick={() => void submit("open")}
                aria-disabled={blocked}
                className={cn(primary, blocked && "bg-white/10 text-white/40 hover:bg-white/10", shakeKey > 0 && motion.shake)}
              >
                {saved ? "✓ Saved" : "Save as open"}
              </button>
              <button type="button" disabled={busy} onClick={() => void submit("planned")} className={secondary}>
                Save as planned
              </button>
            </>
          )}
        </div>
      </form>
    </Panel>
  );
}
