"use client";

import { useEffect, useRef, useState } from "react";
import { useAppState, isPaid } from "@/lib/state";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { Button } from "@/components/ui/Button";
import { formatIDR, cn } from "@/lib/cn";

interface SubscriptionPlan {
  id: string;
  name: string;
  priceIDR: number;
  cadence: "3-month";
  features: string[];
  highlight?: boolean;
}

const PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    priceIDR: 0,
    cadence: "3-month",
    features: [
      "Unfiltered news + impact analysis",
      "Economic calendar",
      "My Channel (founder broadcast)",
      "Public psychology primers",
      "Limited hashtag explorer",
    ],
  },
  {
    id: "vip-trader",
    name: "VIP+ Trader",
    priceIDR: 4_500_000,
    cadence: "3-month",
    highlight: true,
    features: [
      "Everything in Free",
      "Daily / weekly Trading Plan",
      "1v1 Consultation (AI + team)",
      "Full Education library",
      "Full Hashtag explorer",
      "Access to all collab channels",
    ],
  },
];

export default function SubscriptionPage() {
  const { tier, setTier, liabilitySigned } = useAppState();
  const paid = isPaid(tier);
  const [confirming, setConfirming] = useState(false);
  const [confirmingDown, setConfirmingDown] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const confirmDownRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirming && !confirmingDown) return;
    function handleClick(e: MouseEvent) {
      if (confirming && confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
        setConfirming(false);
      }
      if (confirmingDown && confirmDownRef.current && !confirmDownRef.current.contains(e.target as Node)) {
        setConfirmingDown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [confirming, confirmingDown]);

  const upgrade = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setTier("vip");
    setConfirming(false);
  };

  const downgrade = () => {
    if (!confirmingDown) {
      setConfirmingDown(true);
      return;
    }
    setTier("free");
    setConfirmingDown(false);
  };

  return (
    <div className="stagger bg-grid-fine">
      <div className="border-b border-gray-3 bg-gray-2/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <DataLabel>Operator account · Tier control</DataLabel>
          <h1 className="mt-2 font-display text-5xl text-white">
            Subscription <span className="italic text-brand">& Access</span>
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="border border-brand/40 bg-gray-2/30 p-4 sm:p-8">
          <div className="grid grid-cols-12 gap-4 sm:gap-6">
            <div className="col-span-12 lg:col-span-4">
              <DataLabel>Current tier</DataLabel>
              <div className="mt-2 font-display text-3xl text-white sm:text-4xl">
                {paid ? "VIP+ Trader" : "Free"}
              </div>
              <div
                className={cn(
                  "mt-1 font-mono text-[10px] uppercase tracking-widest2",
                  paid ? "text-moss" : "text-white/40"
                )}
              >
                ● {paid ? "OPERATOR · ACTIVE" : "FREE TIER · LIMITED"}
              </div>
            </div>
            <div className="col-span-6 lg:col-span-3">
              <DataLabel>Cadence</DataLabel>
              <div className="mt-2 font-mono text-white">
                {paid ? "3-month" : "—"}
              </div>
            </div>
            <div className="col-span-6 lg:col-span-3">
              <DataLabel>Status</DataLabel>
              <div
                className={cn(
                  "mt-2 font-mono text-sm uppercase tracking-widest2",
                  paid ? "text-moss" : "text-white/40"
                )}
              >
                {paid ? "● ACTIVE" : "—"}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-2">
              <DataLabel>Liability</DataLabel>
              <div
                className={cn(
                  "mt-2 font-mono text-sm uppercase tracking-widest2",
                  liabilitySigned ? "text-moss" : "text-blood-bright"
                )}
              >
                {liabilitySigned ? "✓ SIGNED" : "● UNSIGNED"}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <SectionNumber n="01 /" label="AVAILABLE TIERS" />
          <div className="mt-6 grid grid-cols-12 gap-6">
            {PLANS.map((p, i) => {
              const isCurrent =
                (p.id === "free" && !paid) || (p.id === "vip-trader" && paid);
              return (
                <div
                  key={p.id}
                  className={cn(
                    "col-span-12 border bg-black p-6 transition-colors duration-200 sm:p-8 lg:col-span-6",
                    p.highlight
                      ? "border-brand hover:border-brand/80"
                      : "border-gray-3 hover:border-white/20"
                  )}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <DataLabel>
                        {p.id === "free" ? "Tier 00" : "Tier 01"}
                      </DataLabel>
                      <div className="mt-2 font-display text-2xl text-white sm:text-3xl">
                        {p.name}
                      </div>
                    </div>
                    {isCurrent && (
                      <div className="border border-moss bg-moss/10 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-moss">
                        ● CURRENT
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex items-baseline gap-2">
                    <div
                      className={cn(
                        "font-display text-3xl sm:text-5xl",
                        p.highlight ? "text-brand" : "text-white"
                      )}
                    >
                      IDR {p.priceIDR === 0 ? "0" : formatIDR(p.priceIDR)}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                      / {p.cadence}
                    </div>
                  </div>
                  <ul className="mt-8 space-y-2 text-sm text-white/80">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="font-mono text-brand">+</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    {p.id === "free" ? (
                      <Button
                        ref={confirmDownRef}
                        onClick={downgrade}
                        variant="outline"
                        size="md"
                        disabled={!paid}
                        className="w-full"
                      >
                        {!paid
                          ? "Current tier"
                          : confirmingDown
                            ? "CONFIRM DOWNGRADE — LOSE ACCESS"
                            : "Downgrade →"}
                      </Button>
                    ) : (
                      <Button
                        ref={confirmRef}
                        onClick={upgrade}
                        size="md"
                        disabled={paid}
                        className="w-full"
                      >
                        {paid
                          ? "Active until renewal"
                          : confirming
                            ? "CONFIRM UPGRADE →"
                            : "Upgrade access →"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-12">
          <SectionNumber n="02 /" label="PAYMENT LEDGER" />
          <div className="mt-4 border border-gray-3 px-6 py-12 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
              NO TRANSACTIONS
            </p>
            <p className="mt-2 text-sm text-white/60">
              Payment history will appear here once billing is active.
            </p>
          </div>
        </section>

        <div className="mt-12 border border-gray-3 bg-gray-2/30 p-4 font-mono text-[10px] uppercase tracking-widest2 text-white/50 sm:p-6">
          ALL PRICING IN INDONESIAN RUPIAH (IDR). 3-MONTH BILLING IS A
          DELIBERATE FILTER — ANYONE UNWILLING TO COMMIT A QUARTER IS NOT THE
          TARGET AUDIENCE. NO PRO-RATING. NO REFUNDS.
        </div>
      </div>
    </div>
  );
}
