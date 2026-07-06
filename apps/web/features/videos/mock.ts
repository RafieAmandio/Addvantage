import type { VideoModule } from "@/features/videos/types";

// Offline-dev fixtures (NEXT_PUBLIC_MOCK=1). YouTube IDs are stable public
// videos so thumbnails and the embed player render without the API.
export const videoModules: VideoModule[] = [
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
    slug: "weekly-outlook-w27",
    title: "Weekly Outlook — W27",
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
