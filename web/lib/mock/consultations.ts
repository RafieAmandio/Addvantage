import type { ConsultSession } from "./types";

export const consultSessions: ConsultSession[] = [
  {
    id: "CS-014",
    title: "Sizing for the FOMC short",
    startedAt: "2026-04-07T10:14:00Z",
    lastAt: "2026-04-07T10:42:00Z",
    tags: ["risk-management", "loss-aversion"],
    messages: [
      {
        id: "M-1",
        role: "user",
        ts: "2026-04-07T10:14:00Z",
        body: "Looking at the ES short on the swing plan. I want to take it but I'm down 4% on the week and my hand is shaking on the size button. How do you think about sizing into a setup when you're already in drawdown?",
        tags: [],
      },
      {
        id: "M-2",
        role: "ai",
        ts: "2026-04-07T10:15:00Z",
        body: "Two separate questions in there — let me split them. (1) Is the setup good? (2) Should YOU take it given your current state? They have different answers and conflating them is how drawdowns become disasters.\n\nThe setup itself: confidence 4, clear invalidation, asymmetric R:R. That's a take.\n\nYou specifically: down 4% on the week, hand shaking. That's loss aversion talking — and it's telling you something real. Your nervous system is signaling that another loss right now would push you into a place where you stop trading the system. That's the actual risk, not the trade.\n\nProtocol: take the trade, but at 50% of your normal size. Same stop, same target, half the contracts. The R:R is unchanged. The only thing that changes is whether one more loss puts you in a hole you can't climb out of mentally.",
        tags: ["risk-management", "loss-aversion", "losing-streak"],
      },
      {
        id: "M-3",
        role: "user",
        ts: "2026-04-07T10:22:00Z",
        body: "Half size feels like I'm being a coward.",
        tags: [],
      },
      {
        id: "M-4",
        role: "team",
        author: "Anthony",
        ts: "2026-04-07T10:24:00Z",
        body: "Read primer #P-001 (Loss Aversion). The 'coward' framing is loss aversion in disguise — it's the same impulse that makes traders refuse to cut losers. You're treating a sizing decision as an ego decision. They are not the same thing.\n\nHalf size keeps you in the seat for the next 50 trades. Full size today might keep you out of the next 5.",
        tags: ["loss-aversion", "developing-edge"],
      },
      {
        id: "M-5",
        role: "user",
        ts: "2026-04-07T10:38:00Z",
        body: "Ok. Taking it at half. Logged.",
        tags: [],
      },
      {
        id: "M-6",
        role: "ai",
        ts: "2026-04-07T10:42:00Z",
        body: "Good. One thing to add — write down the exit price right now, before the trade is on. 5,266 stop, targets at 5,184 / 5,142 / 5,098. When price tags any of those, you don't think, you act. The whole point of pre-committing is to remove the moment of decision, because that's exactly when loss aversion will hijack you.",
        tags: ["risk-management", "loss-aversion"],
      },
    ],
  },
  {
    id: "CS-013",
    title: "Is my edge real or am I just lucky?",
    startedAt: "2026-04-05T14:10:00Z",
    lastAt: "2026-04-05T15:02:00Z",
    tags: ["developing-edge", "unprofitability"],
    messages: [
      {
        id: "M-1",
        role: "user",
        ts: "2026-04-05T14:10:00Z",
        body: "I'm 22 trades into a new mean-reversion setup, up 6% on it, win rate 64%. Is this real?",
        tags: [],
      },
      {
        id: "M-2",
        role: "ai",
        ts: "2026-04-05T14:12:00Z",
        body: "Sample is too small to know. 22 trades at 64% sounds great until you remember that random coin flips can throw 22-trade streaks at 64% just from variance. You need n > 100 before the win rate stabilizes enough to trust.\n\nWhat you CAN do at 22: look at the distribution of your wins and losses, not just the count. Are wins ~2x losses? Then even a 45% win rate is profitable. If wins are ~equal to losses, you need >55% just to break even after costs.",
        tags: ["developing-edge", "recency-bias"],
      },
    ],
  },
  {
    id: "CS-012",
    title: "Cutting a winner too early — pattern?",
    startedAt: "2026-04-03T09:30:00Z",
    lastAt: "2026-04-03T10:15:00Z",
    tags: ["loss-aversion"],
    messages: [
      {
        id: "M-1",
        role: "user",
        ts: "2026-04-03T09:30:00Z",
        body: "Took the BTC long from 67k yesterday, target was 71. I closed at 68.4 because I got nervous. It's now 70.8. This keeps happening to me.",
        tags: [],
      },
      {
        id: "M-2",
        role: "ai",
        ts: "2026-04-03T09:32:00Z",
        body: "Classic disposition effect — and you already know the answer because you wrote 'this keeps happening'. You have a pattern. Patterns are fixable.\n\nThe fix is removing the moment of decision. You set the target at 71 BEFORE you entered. You closed at 68.4 BECAUSE of how the trade felt mid-flight. The feeling is the data — but the feeling is also the lie.\n\nMechanical fix: place a limit order at your target the moment you enter. Walk away from the screen.",
        tags: ["loss-aversion", "losing-streak"],
      },
    ],
  },
];
