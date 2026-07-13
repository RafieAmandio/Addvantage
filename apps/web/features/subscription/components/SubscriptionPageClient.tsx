"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataLabel, SectionNumber } from "@/components/ui/Marker";
import { Button } from "@/components/ui/Button";
import { formatIDR, cn } from "@/lib/cn";
import type { SubscriptionStatus } from "../queries/status";
import type { PaymentRecord } from "../queries/history";
import { requestDowngrade } from "../actions";

interface SubscriptionPlan {
  id: string;
  name: string;
  priceIDR: number;
  cadence: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    priceIDR: 0,
    cadence: "forever",
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
    priceIDR: 18_000_000,
    cadence: "1-year",
    highlight: true,
    features: [
      "Everything in Free",
      "Daily / weekly Trading Plan",
      "1v1 Consultation (founders)",
      "Full Education library",
      "Full Hashtag explorer",
      "Access to all collab channels",
    ],
  },
];

interface Props {
  status: SubscriptionStatus | null;
  history: PaymentRecord[];
}

export function SubscriptionPageClient({ status, history }: Props) {
  const router = useRouter();
  const paid = status ? status.tier === "vip" : false;
  const liabilitySigned = status?.signedLiability ?? false;
  const renewsAt = status?.renewsAt;

  // Self-serve payment is temporarily disabled — VIP+ access is granted
  // manually on request. The upgrade CTA is a disabled notice for now.
  const PAYMENTS_ENABLED = false;

  const [confirmingDown, setConfirmingDown] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const confirmDownRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirmingDown) return;
    function handleClick(e: MouseEvent) {
      if (confirmingDown && confirmDownRef.current && !confirmDownRef.current.contains(e.target as Node)) {
        setConfirmingDown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [confirmingDown]);

  const downgrade = () => {
    if (!confirmingDown) {
      setConfirmingDown(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await requestDowngrade();
      if (result.ok) {
        setConfirmingDown(false);
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong");
        setConfirmingDown(false);
      }
    });
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
                {paid ? "1-year" : "—"}
              </div>
            </div>
            <div className="col-span-6 lg:col-span-3">
              <DataLabel>Renews</DataLabel>
              <div
                className={cn(
                  "mt-2 font-mono text-sm uppercase tracking-widest2",
                  paid ? "text-moss" : "text-white/40"
                )}
              >
                {renewsAt
                  ? new Date(renewsAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
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

        {error && (
          <div className="mt-4 border border-blood-bright/40 bg-blood-bright/10 px-4 py-3 font-mono text-xs text-blood-bright">
            {error}
          </div>
        )}

        {!PAYMENTS_ENABLED && !paid && (
          <div className="mt-4 border border-brand/40 bg-brand/[0.06] px-4 py-3 text-sm text-brand sm:px-6">
            <span className="font-mono text-[10px] uppercase tracking-widest2">● Access by request</span>
            <p className="mt-1 text-white/70">
              Self-serve payment is temporarily disabled. To get VIP+ Trader access, please
              contact us and we&apos;ll set you up.
            </p>
          </div>
        )}

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
                        disabled={!paid || isPending}
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
                        size="md"
                        disabled
                        className="w-full"
                      >
                        {paid ? "Active until renewal" : "Contact to get access"}
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
          {history.length === 0 ? (
            <div className="mt-4 border border-gray-3 px-6 py-12 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest2 text-white/40">
                NO TRANSACTIONS
              </p>
              <p className="mt-2 text-sm text-white/60">
                Payment history will appear here once billing is active.
              </p>
            </div>
          ) : (
            <div className="mt-4 border border-gray-3">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-3 bg-gray-2/30">
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest2 text-white/40">Date</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest2 text-white/40">Tier</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest2 text-white/40 text-right">Amount</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest2 text-white/40">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((p) => (
                    <tr key={p.id} className="border-b border-gray-3/50 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-white/60">
                        {new Date(p.paidAt ?? p.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs uppercase text-white/60">{p.tier}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-white">
                        {p.currency} {formatIDR(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "font-mono text-[10px] uppercase tracking-widest2",
                            p.status === "paid" ? "text-moss" : p.status === "failed" ? "text-blood-bright" : "text-white/40"
                          )}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-12 border border-gray-3 bg-gray-2/30 p-4 font-mono text-[10px] uppercase tracking-widest2 text-white/50 sm:p-6">
          ALL PRICING IN INDONESIAN RUPIAH (IDR). ANNUAL BILLING IS A
          DELIBERATE FILTER — ANYONE UNWILLING TO COMMIT A YEAR IS NOT THE
          TARGET AUDIENCE. NO PRO-RATING. NO REFUNDS.
        </div>
      </div>
    </div>
  );
}
