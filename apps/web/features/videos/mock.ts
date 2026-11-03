import type { VideoModule } from "@/features/videos/types";

// Offline-dev fixtures (NEXT_PUBLIC_MOCK=1). YouTube IDs are stable public
// videos so thumbnails and the embed player render without the API.
/** ISO week number of today, so the weekly outlook is always this week's. */
function isoWeek(): number {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return Math.ceil(((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86_400_000 + 1) / 7);
}

export const videoModules = (): VideoModule[] => [
  {
    slug: "market-structure-deep-dive",
    title: "Market Structure Deep-dive",
    description:
      "How the desk maps structure before London open: liquidity pools, prior-day extremes, and the levels that actually matter.",
    category: "analysis",
    provider: "youtube",
    videoId: "jNQXAC9IVRw",
    duration: "42:10",
    sortOrder: 10,
  },
  {
    slug: "weekly-outlook",
    title: `Weekly Outlook, W${isoWeek()}`,
    description:
      "Full macro sweep for the week: DXY posture, index rotation, and the three setups the desk is stalking.",
    category: "analysis",
    provider: "youtube",
    videoId: "dQw4w9WgXcQ",
    duration: "38:55",
    sortOrder: 20,
  },
  {
    slug: "london-session-replay-1",
    title: "London Session Replay #1",
    description:
      "Unedited session replay. Watch the desk work a sweep-and-reclaim on GBPUSD in real time, including the losing first attempt.",
    category: "session",
    provider: "youtube",
    videoId: "9bZkp7q19f0",
    duration: "1:02:33",
    sortOrder: 30,
  },
  {
    slug: "ny-session-replay-1",
    title: "NY Session Replay #1",
    description:
      "NY open playbook applied live: news filter, first-hour range, and trade management through a CPI print.",
    category: "session",
    provider: "youtube",
    videoId: "kJQP7kiw5Fk",
    duration: "55:20",
    sortOrder: 40,
  },
];
