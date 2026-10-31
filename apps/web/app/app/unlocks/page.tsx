import type { Metadata } from "next";
import { getProfile } from "@/lib/auth/session";
import { getTokenUnlocks } from "@/features/unlocks/queries/unlocks";
import { UnlocksView, UnlocksShell } from "@/features/unlocks/components/UnlocksView";
import { UnlocksLocked } from "@/features/unlocks/components/UnlocksLocked";

export const metadata: Metadata = { title: "Token Unlocks" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UnlocksPage() {
  const profile = await getProfile();
  const hasAccess = !!profile && (profile.tier === "vip" || profile.isAdmin);

  if (!hasAccess) return <UnlocksLocked />;

  const data = await getTokenUnlocks();
  if (!data) {
    return (
      <UnlocksShell>
        <p className="rounded-2xl bg-panel px-5 py-16 text-center text-[14px] text-white/40">Unlock radar temporarily unavailable. Try again shortly.</p>
      </UnlocksShell>
    );
  }

  return <UnlocksView data={data} />;
}
