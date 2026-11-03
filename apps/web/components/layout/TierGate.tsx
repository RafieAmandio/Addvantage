"use client";

import { usePathname } from "next/navigation";
import { canOpenRoute } from "@tradevantage/shared";
import { useAppState } from "@/lib/state";
import { PaywallOverlay } from "@/components/ui/Paywall";
import { routeMeta } from "@/components/layout/Sidebar";

/**
 * Route guard for the Black Friday `crypto` tier: any /app page outside its set shows the
 * existing paywall. Free and VIP pages keep their own guards, so this only acts on `crypto`.
 * The API still enforces VIP data; this is the UI treatment.
 */
export function TierGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { tier } = useAppState();
  if (tier !== "crypto" || canOpenRoute(tier, pathname)) return <>{children}</>;
  return (
    <div className="relative min-h-[calc(100vh-80px)]">
      <PaywallOverlay
        surface={routeMeta(pathname).title}
        reason="Your free account opens News, Token Unlocks and Upgrade Radar. Upgrade to VIP+ Trader for the full desk: plans, consults, the forex tools and the calendar."
        back={{ href: "/app/news", label: "Go to News" }}
      />
    </div>
  );
}
