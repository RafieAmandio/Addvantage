"use client";

import { useEffect, useState } from "react";
import { Panel, PanelLink } from "@/components/ui/Panel";
import { cn } from "@/lib/cn";
import { isMockMode } from "@/lib/config/public";
import { DEFAULT_SETTINGS, deleteTrade, getSettings, listTrades, resetDemoJournal, saveSettings } from "../queries";
import { tradeR, type NewsEvent, type Trade, type TraderSettings } from "../lib/journal";
import { TradeForm } from "./TradeForm";
import { ActiveRow, ClosedRow } from "./TradeRows";
import { eyebrow, fmtR, input, money, primary, rCls, small } from "./ui";

function SettingsBar({ settings, onSave }: { settings: TraderSettings; onSave: (s: TraderSettings) => void }) {
  const [edit, setEdit] = useState(false);
  const [equity, setEquity] = useState("");
  const [ccy, setCcy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const open = () => {
    setEquity(String(settings.equity));
    setCcy(settings.currency);
    setError(null);
    setEdit(true);
  };
  if (!edit)
    return (
      <button type="button" onClick={open} className="group flex items-baseline gap-2 rounded-full transition-transform duration-150 active:scale-[0.97]" aria-label="Edit equity">
        <span className="text-[13px] text-white/55">Equity</span>
        <span className="font-num text-[28px] font-semibold leading-7 text-white">{money(settings.equity, settings.currency)}</span>
        <span className="text-[12px] text-white/30 group-hover:text-white/60">Edit</span>
      </button>
    );
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(equity);
        if (!Number.isFinite(n) || n <= 0) return setError("Equity must be above 0.");
        if (!/^[A-Za-z]{3}$/.test(ccy.trim())) return setError("Currency is a 3-letter code.");
        onSave({ ...settings, equity: n, currency: ccy.trim().toUpperCase() });
        setEdit(false);
      }}
    >
      <label className="block w-40 space-y-1">
        <span className="text-[13px] font-medium text-white/70">Equity</span>
        <input autoFocus className={cn(input, "font-num text-[17px]")} inputMode="decimal" value={equity} onChange={(e) => setEquity(e.target.value)} />
      </label>
      <label className="block w-24 space-y-1">
        <span className="text-[13px] font-medium text-white/70">Currency</span>
        <input className={cn(input, "uppercase")} maxLength={3} value={ccy} onChange={(e) => setCcy(e.target.value)} />
      </label>
      <button type="submit" className={primary}>
        Save
      </button>
      <button type="button" className={small} onClick={() => setEdit(false)}>
        Cancel
      </button>
      {error && <p className="w-full text-[13px] text-down">{error}</p>}
    </form>
  );
}

export function JournalClient({ events }: { events: NewsEvent[] }) {
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [settings, setSettings] = useState<TraderSettings>(DEFAULT_SETTINGS);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listTrades(), getSettings()])
      .then(([t, s]) => {
        setTrades(t);
        setSettings(s);
      })
      .catch(() => {
        setTrades([]);
        setError("Could not load your journal.");
      });
  }, []);

  const upsert = (t: Trade) => {
    setTrades((xs) => (xs?.some((x) => x.id === t.id) ? xs.map((x) => (x.id === t.id ? t : x)) : [t, ...(xs ?? [])]));
    setFresh(t.id);
    setEditing(null);
  };
  const remove = async (t: Trade) => {
    if (!window.confirm(`Delete this ${t.symbol} trade?`)) return;
    await deleteTrade(t.id);
    setTrades((xs) => xs?.filter((x) => x.id !== t.id) ?? null);
  };

  const all = trades ?? [];
  const active = all.filter((t) => t.status === "open" || t.status === "planned").sort((a, b) => (a.status === b.status ? b.openedAt.localeCompare(a.openedAt) : a.status === "open" ? -1 : 1));
  const done = all.filter((t) => t.status === "closed" || t.status === "cancelled").sort((a, b) => (b.closedAt ?? b.openedAt).localeCompare(a.closedAt ?? a.openedAt));
  const rs = done.map(tradeR).filter((r): r is number => r !== null);
  const total = rs.reduce((s, r) => s + r, 0);
  const rowProps = { onEdit: setEditing, onDelete: remove };

  return (
    <div className="space-y-4 px-4 pb-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <SettingsBar
          settings={settings}
          onSave={(s) => {
            setSettings(s);
            saveSettings(s).catch(() => setError("Could not save your equity."));
          }}
        />
        <span className="flex items-baseline gap-2">
          <span className="font-num text-[28px] font-semibold leading-7 text-white">{all.filter((t) => t.status === "open").length}</span>
          <span className="text-[13px] text-white/55">Open</span>
        </span>
        <span className="flex items-baseline gap-2">
          <span className={cn("font-num text-[28px] font-semibold leading-7", rCls(total))}>{rs.length ? fmtR(total) : "·"}</span>
          <span className="text-[13px] text-white/55">Closed, {rs.length} trades</span>
        </span>
        <span className="ml-auto flex items-center gap-4">
          {isMockMode() && (
            <button
              type="button"
              className="text-[13px] text-white/40 hover:text-white"
              onClick={() => {
                if (!window.confirm("Reset the demo journal to a fresh history?")) return;
                setTrades(null);
                resetDemoJournal().then(() => window.location.reload());
              }}
            >
              Reset demo journal
            </button>
          )}
          <PanelLink href="/app/journal/review">Review my trades</PanelLink>
        </span>
      </div>
      {error && <p className="text-[13px] text-down">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-4">
          <Panel title="Open and planned" sub="Each open trade is read against the hourly candles since you entered">
            {trades === null ? (
              <p className="text-[14px] text-white/30">Loading</p>
            ) : active.length === 0 ? (
              <p className="text-[14px] text-white/40">Nothing open. Plan a trade on the right; the rules check it as you type.</p>
            ) : (
              <ul className="-my-4 divide-y divide-white/[0.07]">
                {active.map((t) => (
                  <ActiveRow key={t.id} t={t} fresh={fresh === t.id} onChange={upsert} {...rowProps} />
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Closed" sub={rs.length ? `${rs.length} trades, ${fmtR(total)} in total` : undefined}>
            {done.length === 0 ? (
              <p className="text-[14px] text-white/40">Closed trades land here with their result in R and any rule you tagged as broken.</p>
            ) : (
              <ul className="-my-3.5 divide-y divide-white/[0.07]">
                {done.map((t) => (
                  <ClosedRow key={t.id} t={t} fresh={fresh === t.id} {...rowProps} />
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <aside className="min-w-0">
          <TradeForm settings={settings} trades={all} events={events} editing={editing} onSaved={upsert} onCancel={() => setEditing(null)} />
          <p className={cn(eyebrow, "mt-3 px-1 normal-case tracking-normal")}>Sizes use your equity and the setup's risk tier. Hard cap 2% a trade.</p>
        </aside>
      </div>
    </div>
  );
}
