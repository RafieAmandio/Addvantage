import type { ConsultMessage } from "@/features/consult/types";

const CANNED_REPLIES: Array<{ body: string; tags: ConsultMessage["tags"] }> = [
  {
    body: "Acknowledged. What's the current state of your position size relative to your account, and what's your hard invalidation level? Without those two numbers I can't give you a directional answer, only a process answer.",
    tags: ["risk-management"],
  },
  {
    body: "Before we go further — is the setup the one you pre-committed to, or are you trying to justify entering something that didn't fit the plan? Trading is the only profession where 'I changed my mind' costs you money every time.",
    tags: ["developing-edge", "loss-aversion"],
  },
  {
    body: "The feeling you're describing is loss aversion talking. That doesn't make it wrong — it means your nervous system is telling you something real. The question is whether that something is 'the trade is broken' or 'I'm in drawdown and I'm shaken'. Those require opposite actions.",
    tags: ["loss-aversion", "losing-streak"],
  },
  {
    body: "Write down the three things that have to be true for this trade to still be valid in 4 hours. If any of them changes, the plan isn't 'hold and hope', the plan is 'exit'. Pre-commit now while you can think clearly.",
    tags: ["risk-management"],
  },
  {
    body: "I want to separate two questions: (1) is this a good setup in isolation, and (2) is it a good setup FOR YOU, given your current state? They often have different answers. Drawdown changes the answer to #2 even when #1 hasn't moved.",
    tags: ["risk-management", "losing-streak"],
  },
  {
    body: "That's variance, not a signal yet. 22 trades is below the threshold where win rate stabilises. Track your distribution — are wins 2x losses, or are they equal? The R:R matters more than the hit rate at small samples.",
    tags: ["developing-edge", "recency-bias"],
  },
  {
    body: "Stop. Read primer P-001 (Loss Aversion) before you do anything else. The impulse you're having right now has a name, and it's the same impulse that has cost every trader on the desk more money than they want to admit. Name it and you can work around it.",
    tags: ["loss-aversion", "sunk-cost"],
  },
  {
    body: "The tape is noise until you have a hypothesis. What's the hypothesis? One sentence. If you can't state it cleanly, you don't have a trade, you have a vibe — and vibes don't have edge.",
    tags: ["developing-edge", "unprofitability"],
  },
];

const REPLY_KEYWORDS: Array<{ pattern: RegExp; replies: number[] }> = [
  { pattern: /\b(size|sizing|position|risk|stop|invalidat)/i, replies: [0, 3, 4] },
  { pattern: /\b(loss|losing|drawdown|down|hurt|pain|red|underwater)/i, replies: [2, 6, 4] },
  { pattern: /\b(edge|setup|hypothesis|system|sample|win\s*rate|hit\s*rate)/i, replies: [5, 7, 1] },
  { pattern: /\b(scared|nervous|fear|anxious|fomo|euphori|greed|cocky)/i, replies: [2, 6] },
  { pattern: /\b(should\s*i|am\s*i|right|wrong|opinion|review)/i, replies: [1, 4] },
  { pattern: /\b(plan|trade|entry|target|exit)/i, replies: [3, 1] },
];

export function pickReply(userMessage: string, fallbackIdx: number) {
  for (const { pattern, replies } of REPLY_KEYWORDS) {
    if (pattern.test(userMessage)) {
      return CANNED_REPLIES[replies[fallbackIdx % replies.length]];
    }
  }
  return CANNED_REPLIES[fallbackIdx % CANNED_REPLIES.length];
}
