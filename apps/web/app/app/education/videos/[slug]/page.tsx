import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { listVideos } from "@/features/videos/queries/videos";
import { VideoWatchView } from "@/features/videos/components/VideoWatchView";

export const metadata: Metadata = { title: "Video Modules" };
export const dynamic = "force-dynamic";

export default async function VideoWatchPage({
  params,
}: {
  params: { slug: string };
}) {
  const profile = await getProfile();
  const hasAccess = !!profile && (profile.tier === "vip" || profile.isAdmin);
  if (!hasAccess) redirect("/app/education/videos");

  const videos = await listVideos();
  const index = videos.findIndex((v) => v.slug === params.slug);
  if (index === -1) notFound();

  return (
    <VideoWatchView
      video={videos[index]}
      index={index}
      prev={index > 0 ? videos[index - 1] : null}
      next={index < videos.length - 1 ? videos[index + 1] : null}
    />
  );
}
