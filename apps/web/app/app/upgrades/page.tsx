import type { Metadata } from "next";
import { canOpenRoute } from "@tradevantage/shared";
import { getProfile } from "@/lib/auth/session";
import { getUpgradeRadar } from "@/features/upgrades/queries/upgrades";
import {
  UpgradeRadarView,
  UpgradeRadarShell,
} from "@/features/upgrades/components/UpgradeRadarView";
import { UpgradeRadarLocked } from "@/features/upgrades/components/UpgradeRadarLocked";

export const metadata: Metadata = { title: "Upgrade Radar" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UpgradesPage() {
  const profile = await getProfile();
  const hasAccess = !!profile && (canOpenRoute(profile.tier, "/app/upgrades") || profile.isAdmin);

  if (!hasAccess) return <UpgradeRadarLocked />;

  const data = await getUpgradeRadar();
  if (!data) {
    return (
      <UpgradeRadarShell>
        <p className="rounded-2xl bg-panel px-5 py-16 text-center text-[14px] text-white/40">Upgrade radar temporarily unavailable. Try again shortly.</p>
      </UpgradeRadarShell>
    );
  }

  return <UpgradeRadarView data={data} />;
}
