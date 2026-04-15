"use client";

import { useState } from "react";
import { subscriptionPlans } from "@/lib/mock/plans";
import { useAppState, isPaid } from "@/lib/state";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { Button } from "@/components/ui/Button";
import { formatIDR, cn, formatDate } from "@/lib/cn";

export default function SubscriptionPage() {
  const { tier, setTier, liabilitySigned } = useAppState();
  const paid = isPaid(tier);
  const [confirming, setConfirming] = useState(false);
  const [confirmingDown, setConfirmingDown] = useState(false);

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
    <div className="bg-grid-fine">
      <div className="border-b border-ink-3 bg-ink-2/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <DataLabel>Operator account · Tier control</DataLabel>
          <h1 className="mt-2 font-display text-5xl text-paper">
            Subscription <span className="italic text-amber">& Access</span>
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Status panel */}
        <section className="border border-amber/40 bg-ink-2/30 p-8">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <DataLabel>Current tier</DataLabel>
              <div className="mt-2 font-display text-4xl text-paper">
                {paid ? "VIP+ Trader" : "Free"}
              </div>
              <div
                className={
                  "mt-1 font-mono text-[10px] uppercase tracking-widest2 " +
                  (paid ? "text-moss" : "text-paper/40")
                }
              >
                ● {paid ? "OPERATOR · ACTIVE" : "FREE TIER · LIMITED"}
              </div>
            </div>
            <div className="col-span-6 lg:col-span-3">
              <DataLabel>Renews</DataLabel>
              <div className="mt-2 font-mono text-paper">
                {paid ? formatDate("2026-07-07T00:00:00Z") : "—"}
              </div>
            </div>
            <div className="col-span-6 lg:col-span-3">
              <DataLabel>Cadence</DataLabel>
              <div className="mt-2 font-mono text-paper">3-month</div>
            </div>
            <div className="col-span-12 lg:col-span-2">
              <DataLabel>Liability</DataLabel>
              <div
                className={
                  "mt-2 font-mono text-sm uppercase tracking-widest2 " +
                  (liabilitySigned ? "text-moss" : "text-blood")
                }
              >
                {liabilitySigned ? "✓ SIGNED" : "● UNSIGNED"}
              </div>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="mt-12">
          <SectionNumber n="01 /" label="AVAILABLE TIERS" />
          <div className="mt-6 grid grid-cols-12 gap-6">
            {subscriptionPlans.map((p) => {
              const isCurrent =
                (p.id === "free" && !paid) || (p.id === "vip-trader" && paid);
              return (
                <div
                  key={p.id}
                  className={cn(
                    "col-span-12 border bg-ink p-8 lg:col-span-6",
                    p.highlight
                      ? "border-amber"
                      : "border-ink-3"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <DataLabel>
                        {p.id === "free" ? "Tier 00" : "Tier 01"}
                      </DataLabel>
                      <div className="mt-2 font-display text-3xl text-paper">
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
                      className={
                        "font-display text-5xl " +
                        (p.highlight ? "text-amber" : "text-paper")
                      }
                    >
                      IDR {p.priceIDR === 0 ? "0" : formatIDR(p.priceIDR)}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest2 text-paper/40">
                      / {p.cadence}
                    </div>
                  </div>
                  <ul className="mt-8 space-y-2 text-sm text-paper/80">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="font-mono text-amber">+</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    {p.id === "free" ? (
                      <Button
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

        {/* Payment history */}
        <section className="mt-12">
          <SectionNumber n="02 /" label="PAYMENT LEDGER" />
          <div className="mt-4 border border-ink-3">
            <table className="w-full font-mono text-xs">
              <thead className="bg-ink-2 text-[9px] uppercase tracking-widest2 text-paper/40">
                <tr>
                  <th className="px-4 py-3 text-left">TXN ID</th>
                  <th className="px-4 py-3 text-left">DATE</th>
                  <th className="px-4 py-3 text-left">METHOD</th>
                  <th className="px-4 py-3 text-left">PACKAGE</th>
                  <th className="px-4 py-3 text-right">AMOUNT</th>
                  <th className="px-4 py-3 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    id: "TX-202604-00417",
                    date: "07 Apr 2026",
                    method: "BCA · VA",
                    pkg: "VIP+ Trader · Q2",
                    amt: "IDR 4,500,000",
                    s: "PAID",
                  },
                  {
                    id: "TX-202601-00417",
                    date: "07 Jan 2026",
                    method: "OVO",
                    pkg: "VIP+ Trader · Q1",
                    amt: "IDR 4,500,000",
                    s: "PAID",
                  },
                  {
                    id: "TX-202510-00417",
                    date: "07 Oct 2025",
                    method: "Bank Transfer",
                    pkg: "VIP+ Trader · Q4",
                    amt: "IDR 4,200,000",
                    s: "PAID",
                  },
                ].map((row, i) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-t border-ink-3",
                      i % 2 === 0 ? "bg-ink" : "bg-ink-2/30"
                    )}
                  >
                    <td className="px-4 py-3 text-amber">{row.id}</td>
                    <td className="px-4 py-3 text-paper/80">{row.date}</td>
                    <td className="px-4 py-3 text-paper/80">{row.method}</td>
                    <td className="px-4 py-3 text-paper/80">{row.pkg}</td>
                    <td className="px-4 py-3 text-right text-paper">
                      {row.amt}
                    </td>
                    <td className="px-4 py-3 text-right text-moss">
                      ● {row.s}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-12 border border-ink-3 bg-ink-2/30 p-6 font-mono text-[10px] uppercase tracking-widest2 text-paper/50">
          ALL PRICING IN INDONESIAN RUPIAH (IDR). 3-MONTH BILLING IS A
          DELIBERATE FILTER — ANYONE UNWILLING TO COMMIT A QUARTER IS NOT THE
          TARGET AUDIENCE. NO PRO-RATING. NO REFUNDS.
        </div>
      </div>
    </div>
  );
}
