"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Tier } from "./mock/types";

export interface TraderProfile {
  tradingLength: string;
  longestProfitable: string;
  markets: string[];
  yearlyGoal: string;
  faultAttribution: string;
}

interface AppState {
  tier: Tier;
  setTier: (t: Tier) => void;
  liabilitySigned: boolean;
  signLiability: () => void;
  resetLiability: () => void;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  operatorName: string;
  setOperatorName: (name: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  traderProfile: TraderProfile | null;
  setTraderProfile: (p: TraderProfile) => void;
}

const Ctx = createContext<AppState | null>(null);

const STORAGE_KEY = "ants-domain-state-v1";

interface Persisted {
  tier: Tier;
  liabilitySigned: boolean;
  operatorName?: string;
  sidebarCollapsed?: boolean;
  traderProfile?: TraderProfile | null;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTierState] = useState<Tier>("free");
  const [liabilitySigned, setLiabilitySigned] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [operatorName, setOperatorName] = useState("Operator");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [traderProfile, setTraderProfile] = useState<TraderProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        setTierState(parsed.tier ?? "free");
        setLiabilitySigned(parsed.liabilitySigned ?? false);
        if (parsed.operatorName) setOperatorName(parsed.operatorName);
        if (typeof parsed.sidebarCollapsed === "boolean") {
          setSidebarCollapsed(parsed.sidebarCollapsed);
        }
        if (parsed.traderProfile) setTraderProfile(parsed.traderProfile);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tier,
          liabilitySigned,
          operatorName,
          sidebarCollapsed,
          traderProfile,
        } satisfies Persisted)
      );
    } catch {}
  }, [tier, liabilitySigned, operatorName, sidebarCollapsed, traderProfile, hydrated]);

  const value: AppState = {
    tier,
    setTier: setTierState,
    liabilitySigned,
    signLiability: () => setLiabilitySigned(true),
    resetLiability: () => setLiabilitySigned(false),
    navOpen,
    setNavOpen,
    searchOpen,
    setSearchOpen,
    operatorName,
    setOperatorName,
    sidebarCollapsed,
    setSidebarCollapsed,
    traderProfile,
    setTraderProfile,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState must be used inside AppStateProvider");
  return v;
}

export function isPaid(tier: Tier) {
  return tier === "vip";
}
