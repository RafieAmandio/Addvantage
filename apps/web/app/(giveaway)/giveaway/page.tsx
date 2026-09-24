import type { Metadata } from "next";
import Link from "next/link";
import { GiveawayForm } from "@/features/giveaway/components/GiveawayForm";
import { BINGX_REF_URL, REWARDS, STEPS } from "@/features/giveaway/content";

export const metadata: Metadata = {
  title: "TradeVantage Giveaway — Trade & Win",
  description:
    "Register on BingX, trade, and submit your User ID to join the TradeVantage $100 weekly giveaway. Open to all new users.",
  robots: { index: false, follow: false },
};

export default function GiveawayPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
        <Link href="/" className="font-mono text-base font-bold text-white">
          +vantage
        </Link>

        {/* Hero */}
        <div className="mt-12">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest2 text-brand">
            <span className="led animate-pulse" aria-hidden />
            Giveaway · Open to all new users
          </span>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,8vw,72px)] font-bold leading-[0.98] text-white">
            Get <span className="text-brand">28 USDT</span>
            <br />
            and a chance to win <span className="text-brand">$100</span>
          </h1>
          <p className="mt-5 max-w-xl font-mono text-sm leading-[1.6] text-white/60">
            Register and trade on BingX for a 20 USDT voucher plus 8 USDT cash, then get a shot at the{" "}
            <span className="text-white">$100 giveaway</span> drawn every Saturday. Submit your BingX
            User ID below to enter.
          </p>
        </div>

        {/* Rewards */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {REWARDS.map((r) => (
            <div key={r.label} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="font-display text-3xl font-bold text-brand">{r.value}</div>
              <div className="mt-1 font-mono text-xs text-white/50">{r.label}</div>
            </div>
          ))}
        </div>

        {/* CTA to register */}
        <a
          href={BINGX_REF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-lg border border-brand bg-brand px-6 py-3.5 font-mono text-sm font-bold text-black transition-all hover:bg-brand-dim active:scale-[0.98]"
        >
          Register on BingX →
        </a>

        {/* Steps + form */}
        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_minmax(340px,420px)]">
          <div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest2 text-white/70">
              How it works
            </h2>
            <ol className="mt-6 space-y-6">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="font-mono text-sm font-bold text-brand">{s.n}</span>
                  <div>
                    <div className="font-display text-lg text-white">{s.title}</div>
                    <p className="mt-1 max-w-md font-mono text-sm leading-[1.6] text-white/50">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7">
            <h2 className="font-display text-2xl text-white">Enter the giveaway</h2>
            <p className="mt-1 font-mono text-xs text-white/40">
              One entry per BingX UID. Winners announced Saturday.
            </p>
            <div className="mt-6">
              <GiveawayForm />
            </div>
          </div>
        </div>

        <p className="mt-16 font-mono text-[11px] leading-[1.6] text-white/25">
          Rewards are provided by BingX under their promotion terms. TradeVantage runs the weekly $100
          giveaway among verified entries. Trading involves substantial risk of loss.
        </p>
      </div>
    </main>
  );
}
