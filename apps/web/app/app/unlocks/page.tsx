import type { Metadata } from "next";
import { getProfile } from "@/lib/auth/session";
import { getTokenUnlocks } from "@/features/unlocks/queries/unlocks";
import { UnlocksView, UnlocksHeader } from "@/features/unlocks/components/UnlocksView";
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
      <div className="min-h-screen">
        <UnlocksHeader count={null} />
        <div className="px-4 py-20 text-center text-sm text-white/40 sm:px-6">
          Unlock radar temporarily unavailable. Try again shortly.
        </div>
      </div>
    );
  }

  return <UnlocksView data={data} />;
}
