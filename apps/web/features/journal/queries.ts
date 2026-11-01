"use client";

import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import { isMockMode } from "@/lib/config/public";
import type { Trade, TraderSettings } from "./lib/journal";

/** One market picked in the morning scan, with the trader's answers to the prep questions. */
export interface PlanPick {
  symbol: string;
  answers: Record<string, boolean | null>;
  /** 1 to 5: how clear the read is. */
  clarity: number;
  note: string;
}

export interface DailyPlan {
  /** YYYY-MM-DD, the trader's WIB date. */
  date: string;
  picks: PlanPick[];
  updatedAt: string;
}

export type TradeInput = Omit<Trade, "id" | "createdAt" | "updatedAt">;

export const DEFAULT_SETTINGS: TraderSettings = { equity: 10000, currency: "USD", riskTier: 1.5 };

// Mock mode keeps everything in this browser, like the watchlist does.
const K = { trades: "tv-journal-trades", settings: "tv-journal-settings", plans: "tv-journal-plans" };
function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* private window: state lives for this page only */
  }
}

export async function listTrades(): Promise<Trade[]> {
  if (isMockMode()) return read<Trade[]>(K.trades, []);
  return apiGet<Trade[]>("/journal/trades");
}

export async function saveTrade(input: TradeInput, id?: string): Promise<Trade> {
  if (isMockMode()) {
    const all = read<Trade[]>(K.trades, []);
    const now = new Date().toISOString();
    const prev = id ? all.find((t) => t.id === id) : undefined;
    const t: Trade = { ...input, id: id ?? crypto.randomUUID(), createdAt: prev?.createdAt ?? now, updatedAt: now };
    write(K.trades, prev ? all.map((x) => (x.id === id ? t : x)) : [t, ...all]);
    return t;
  }
  return id ? apiPut<Trade>(`/journal/trades/${id}`, input) : apiPost<Trade>("/journal/trades", input);
}

export async function deleteTrade(id: string): Promise<void> {
  if (isMockMode()) return write(K.trades, read<Trade[]>(K.trades, []).filter((t) => t.id !== id));
  return apiDelete(`/journal/trades/${id}`);
}

export async function getSettings(): Promise<TraderSettings> {
  if (isMockMode()) return read(K.settings, DEFAULT_SETTINGS);
  return apiGet<TraderSettings>("/journal/settings").catch(() => DEFAULT_SETTINGS);
}

export async function saveSettings(s: TraderSettings): Promise<TraderSettings> {
  if (isMockMode()) {
    write(K.settings, s);
    return s;
  }
  return apiPut<TraderSettings>("/journal/settings", s);
}

/** The morning plan for a WIB date (YYYY-MM-DD), or null if none saved. */
export async function getPlan(date: string): Promise<DailyPlan | null> {
  if (isMockMode()) return read<Record<string, DailyPlan>>(K.plans, {})[date] ?? null;
  return apiGet<DailyPlan | null>(`/journal/plan?date=${encodeURIComponent(date)}`);
}

export async function savePlan(date: string, picks: PlanPick[]): Promise<DailyPlan> {
  if (isMockMode()) {
    const plan = { date, picks, updatedAt: new Date().toISOString() };
    write(K.plans, { ...read<Record<string, DailyPlan>>(K.plans, {}), [date]: plan });
    return plan;
  }
  return apiPut<DailyPlan>("/journal/plan", { date, picks });
}
