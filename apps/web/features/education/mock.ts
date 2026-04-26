import type { Primer } from "@/features/education/types";

export const primers: Primer[] = [
  {
    id: "P-001",
    title: "Loss Aversion",
    author: "Anthony",
    framework: "Kahneman & Tversky, 1979 — Prospect Theory",
    summary:
      "The pain of losing a dollar is roughly twice the pleasure of gaining one. Most trading mistakes are downstream of this single asymmetry.",
    body: [
      "Kahneman and Tversky's prospect theory established that humans evaluate gains and losses asymmetrically. Losing $100 hurts about as much as gaining $200 feels good. Every trader has felt this — the inability to cut a loser, the rush to lock a winner too early.",
      "The trading expression of loss aversion is the 'disposition effect': we hold losers too long and sell winners too quickly. Both behaviors are negative-EV. The losers are losers because the thesis broke; the winners are winners because the thesis is working.",
      "The fix is mechanical, not emotional. Pre-commit to your invalidation level before the trade is on. Write it down. When price hits, you exit — no analysis, no rationalisation. The whole point of the rule is to remove the moment of decision, because the moment of decision is exactly when loss aversion will hijack you.",
    ],
    tags: ["loss-aversion", "risk-management", "losing-streak"],
    readingMin: 4,
    locked: false,
  },
  {
    id: "P-002",
    title: "Recency Bias",
    author: "Anthony",
    framework: "Tversky & Kahneman, 1973 — Availability Heuristic",
    summary:
      "Your brain weights the last three trades more than the previous thirty. This is why winners get cocky and losers turn paranoid.",
    body: [
      "The availability heuristic says we judge probability by how easily examples come to mind. After a string of wins, winning feels easy and we size up. After a string of losses, losing feels inevitable and we size down — exactly when we should be doing the opposite.",
      "Recency bias is most dangerous when your edge is real but the recent sample is small. A 55% system will still throw 5-loss streaks — not because it's broken, but because variance.",
      "Counter it by tracking outcomes per setup, not per recent session. Your edge lives in 200-trade samples, not 20.",
    ],
    tags: ["recency-bias", "developing-edge", "unprofitability"],
    readingMin: 3,
    locked: true,
  },
  {
    id: "P-003",
    title: "Sunk Cost Trap",
    author: "Anthony",
    framework: "Arkes & Blumer, 1985",
    summary:
      "The money you've already lost on a trade has zero predictive power for what happens next. Your account doesn't care how much you've put in — only what's there now.",
    body: [
      "Sunk cost fallacy is the reason traders average down on broken theses. The reasoning: 'I'm already down $X, so I might as well add to bring my average down.' This is rational accounting and irrational trading.",
      "The question is never 'how do I recover what I lost'. The question is 'given today's price and today's information, would I open this trade right now?' If the answer is no, you close. The previous loss is paid; you're not getting it back from this trade.",
    ],
    tags: ["sunk-cost", "losing-streak", "loss-aversion"],
    readingMin: 3,
    locked: true,
  },
  {
    id: "P-004",
    title: "Surviving a Drawdown",
    author: "Anthony",
    framework: "Operational protocol",
    summary:
      "Drawdowns are not solved by trying harder. They are solved by trading smaller, slower, and with the same system you had before the streak began.",
    body: [
      "When you're down 8-10%, the temptation is to 'win it back'. This is the highest-mortality move in trading. The moment you start sizing up to recover faster, you've stopped trading your edge and started gambling.",
      "Protocol: cut size by 50% the moment you cross your drawdown threshold. Trade the exact same setups, the exact same way, just smaller. Hold position until you've returned to peak — not because the small size is profitable, but because it keeps you in the seat without doing damage. The edge does the work.",
      "If the drawdown extends beyond 2x your historical worst, stop entirely. Audit the system. Most extended drawdowns are not bad luck — they're regime change you haven't recognised yet.",
    ],
    tags: ["losing-streak", "risk-management", "developing-edge"],
    readingMin: 5,
    locked: true,
  },
  {
    id: "P-006",
    title: "IDX Foreign Flow as a Signal",
    author: "Anthony",
    framework: "IDX market microstructure",
    summary:
      "In a market where local liquidity is thin and dominated by retail, foreign net buy/sell is the cleanest read on positioning. Most traders watch the wrong number.",
    body: [
      "JKSE is structurally different from Western indices. Free float is concentrated in a handful of names — BBCA, BBRI, BMRI, BBNI, TLKM, ASII — and foreign ownership of those names regularly exceeds 50%. That single fact changes how you should read the tape.",
      "The headline 'foreign net buy: +Rp 1.2T' is almost useless. The real signal is concentration. If foreign buying is spread across 30+ names, it's index-level positioning — slow, structural, and not actionable on the day. If it's concentrated in 3-4 banks, it's a directional bet on the rupiah, the BI decision, or the carry trade. Two completely different trades, same headline number.",
      "The check: pull the top-5 foreign-net-buy names and the top-5 sell names. If the buy side is dominated by big-four banks AND the sell side is dominated by exporters (commodities, palm oil), the trade is a long-IDR carry positioning bet. If the buy side is exporters and the sell side is banks, it's the opposite — foreigners are positioning for IDR weakness.",
      "Layer this onto USDIDR. When BI is defending a rupiah level (currently 16,000), foreign concentration in banks is the early signal that someone believes the defence will hold. When that concentration breaks, it usually breaks 24-48h before the rupiah does.",
    ],
    tags: ["developing-edge", "trend-following"],
    readingMin: 5,
    locked: true,
  },
  {
    id: "P-005",
    title: "Building an Edge",
    author: "Anthony",
    framework: "Process protocol",
    summary:
      "Edge is built in three phases: hypothesis, sample, refinement. Most traders never finish phase one.",
    body: [
      "Phase 1 — Hypothesis. State the setup in one sentence: 'When X happens in Y context, Z is more likely than chance.' If you can't state it that cleanly, you don't have an edge yet, you have a vibe.",
      "Phase 2 — Sample. Trade the setup exactly as defined for at least 50 instances. No deviations. No 'this one's different.' Track every outcome.",
      "Phase 3 — Refinement. Look at the losers. What context filtered them? Add the filter, retest. This is where 90% of the work is.",
    ],
    tags: ["developing-edge", "unprofitability"],
    readingMin: 4,
    locked: true,
  },
];
