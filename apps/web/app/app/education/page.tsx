import type { Metadata } from "next";
import { getProfile } from "@/lib/auth/session";
import { listVideos } from "@/features/videos/queries/videos";
import { RecordingsView } from "@/features/videos/components/RecordingsView";
import { VideoModulesLocked } from "@/features/videos/components/VideoModulesLocked";

export const metadata: Metadata = { title: "Video Modules" };
export const dynamic = "force-dynamic";

export default async function VideoModulesPage() {
  const profile = await getProfile();
  const hasAccess = !!profile && (profile.tier === "vip" || profile.isAdmin);

  if (!hasAccess) return <VideoModulesLocked />;

  const videos = await listVideos();
  return <RecordingsView videos={videos} />;
}
