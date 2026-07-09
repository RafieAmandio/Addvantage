import type { Metadata } from "next";
import { getProfile } from "@/lib/auth/session";
import { getUpgradeRadar } from "@/features/upgrades/queries/upgrades";
import {
  UpgradeRadarView,
  UpgradeRadarHeader,
} from "@/features/upgrades/components/UpgradeRadarView";
import { UpgradeRadarLocked } from "@/features/upgrades/components/UpgradeRadarLocked";

export const metadata: Metadata = { title: "Upgrade Radar" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UpgradesPage() {
  const profile = await getProfile();
  const hasAccess = !!profile && (profile.tier === "vip" || profile.isAdmin);

  if (!hasAccess) return <UpgradeRadarLocked />;

  const data = await getUpgradeRadar();
  if (!data) {
    return (
      <div className="min-h-screen">
        <UpgradeRadarHeader count={null} />
        <div className="px-4 py-20 text-center text-sm text-white/40 sm:px-6">
          Upgrade radar temporarily unavailable. Try again shortly.
        </div>
      </div>
    );
  }

  return <UpgradeRadarView data={data} />;
}
