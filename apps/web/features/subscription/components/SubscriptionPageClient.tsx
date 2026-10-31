"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
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

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="grid gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        {error && (
          <p role="alert" className="rounded-2xl bg-down/10 px-5 py-3 text-[14px] text-down">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {PLANS.map((p) => {
            const isCurrent = (p.id === "free" && !paid) || (p.id === "vip-trader" && paid);
            const yellow = !!p.highlight;
            return (
              <section
                key={p.id}
                aria-label={`${p.name} plan`}
                className={cn(
                  "flex min-w-0 flex-col rounded-2xl p-5 sm:p-6",
                  yellow ? "bg-brand text-black" : "bg-panel text-white",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("text-[12px] font-semibold uppercase tracking-[0.08em]", yellow ? "text-black/60" : "text-white/40")}>
                    {p.name}
                  </p>
                  {isCurrent && (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[12px] font-semibold uppercase tracking-[0.06em]",
                        yellow ? "bg-black text-brand" : "border border-white/[0.14] text-white/70",
                      )}
                    >
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
                  <span className="font-num text-[40px] font-semibold leading-[44px] tracking-[-0.01em]">
                    IDR {p.priceIDR === 0 ? "0" : formatIDR(p.priceIDR)}
                  </span>
                  <span className={cn("text-[14px]", yellow ? "text-black/55" : "text-white/40")}>/ {p.cadence}</span>
                </p>
                <ul className={cn("mt-5 flex-1 divide-y text-[14px] leading-[21px]", yellow ? "divide-black/10" : "divide-white/[0.07] text-white/75")}>
                  {p.features.map((f) => (
                    <li key={f} className="py-2">
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  {p.id === "free" ? (
                    <button
                      ref={confirmDownRef}
                      type="button"
                      onClick={downgrade}
                      disabled={!paid || isPending}
                      className={cn(
                        "flex h-11 w-full items-center justify-center rounded-full border text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:cursor-not-allowed",
                        confirmingDown ? "border-down text-down" : "border-white/[0.14] text-white hover:bg-raised disabled:text-white/40 disabled:hover:bg-transparent",
                      )}
                    >
                      {!paid ? "Current tier" : confirmingDown ? "Confirm downgrade, lose access" : "Downgrade"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex h-11 w-full cursor-not-allowed items-center justify-center rounded-full bg-black text-[14px] font-semibold text-white/80"
                    >
                      {paid ? "Active until renewal" : "Contact to get access"}
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <Panel title="Payment history" sub={history.length ? `${history.length} transactions` : undefined}>
          {history.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-white/40">Payment history will appear here once billing is active.</p>
          ) : (
            <ul className="-my-1 divide-y divide-white/[0.07]">
              {history.map((p) => (
                <li key={p.id} className="flex items-center gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-white">{p.tier === "vip" ? "VIP+ Trader" : p.tier}</p>
                    <p className="text-[13px] text-white/40">{fmtDate(p.paidAt ?? p.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-num text-[20px] font-semibold leading-6 text-white">
                      {p.currency} {formatIDR(p.amount)}
                    </p>
                    <p
                      className={cn(
                        "text-[12px] font-semibold uppercase tracking-[0.06em]",
                        p.status === "paid" ? "text-up" : p.status === "failed" ? "text-down" : "text-white/40",
                      )}
                    >
                      {p.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel title="Your access">
          <dl className="-my-1 divide-y divide-white/[0.07] text-[14px]">
            {[
              ["Tier", paid ? "VIP+ Trader" : "Free", paid ? "text-white" : "text-white/55"],
              ["Cadence", paid ? "1-year" : "None", "text-white/75"],
              ["Renews", renewsAt ? fmtDate(renewsAt) : "None", "text-white/75"],
              ["Liability", liabilitySigned ? "Signed" : "Unsigned", liabilitySigned ? "text-up" : "text-down"],
            ].map(([k, v, tone]) => (
              <div key={k} className="flex items-center justify-between py-2.5">
                <dt className="text-white/40">{k}</dt>
                <dd className={cn("font-medium", tone)}>{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        {!PAYMENTS_ENABLED && !paid && (
          <Panel title="Access by request">
            <p className="text-[14px] leading-[21px] text-white/55">
              Self-serve payment is temporarily disabled. To get VIP+ Trader access, contact us and we&apos;ll set you up.
            </p>
          </Panel>
        )}

        <Panel title="Billing terms">
          <p className="text-[14px] leading-[21px] text-white/55">
            All pricing in Indonesian Rupiah. Annual billing is a deliberate filter: anyone unwilling to commit a year is not the target audience. No pro-rating, no refunds.
          </p>
        </Panel>
      </aside>
    </div>
  );
}
