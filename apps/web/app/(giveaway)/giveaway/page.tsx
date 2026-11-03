import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { GiveawayForm } from "@/features/giveaway/components/GiveawayForm";
import {
  BINGX_KYC_TRANSFER_URL,
  BINGX_REF_URL,
  REWARDS,
  STEPS,
  SUPPORT_TELEGRAM,
  SUPPORT_TELEGRAM_URL,
} from "@/features/giveaway/content";

export const metadata: Metadata = {
  title: "TradeVantage Giveaway: Trade and Win",
  description:
    "Register on BingX, trade, and submit your User ID to join the TradeVantage $100 giveaway. Open to all new users.",
  robots: { index: false, follow: false },
};

const eyebrow = "text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40";
const link = "text-white underline decoration-white/30 underline-offset-2 hover:decoration-brand";

export default function GiveawayPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-4 py-5 text-white sm:px-6">
      <Link href="/" aria-label="TradeVantage home" className="inline-flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-vantage.png" alt="TradeVantage" className="h-7 w-auto" />
      </Link>

      <div className="mx-auto mt-8 grid w-full max-w-5xl gap-4 pb-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Panel>
            <p className={eyebrow}>Giveaway · Open to all new users</p>
            <h1 className="mt-2 text-[28px] font-semibold leading-[34px] text-white sm:text-[34px] sm:leading-[40px]">
              Get <span className="text-brand">28 USDT</span> and a chance to win{" "}
              <span className="text-brand">$100</span>
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-[22px] text-white/55">
              Register and trade on BingX for a 20 USDT voucher plus 8 USDT cash, then get a shot at the{" "}
              <span className="text-white">$100 giveaway</span>. Submit your BingX User ID to enter.
            </p>

            <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-white/[0.07] pt-5">
              {REWARDS.map((r) => (
                <div key={r.label} className="flex min-w-0 flex-col">
                  <dt className="order-2 mt-1 text-[13px] leading-[18px] text-white/55">{r.label}</dt>
                  <dd className="font-num text-[30px] font-semibold leading-none text-white sm:text-[40px]">{r.value}</dd>
                </div>
              ))}
            </dl>

            <a
              href={BINGX_REF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-brand px-6 text-[14px] font-semibold text-black transition-opacity hover:opacity-90"
            >
              Register on BingX ↗
            </a>
          </Panel>

          <Panel title="How it works">
            <ol className="divide-y divide-white/[0.07]">
              {STEPS.map((s, i) => (
                <li key={s.n} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="w-4 shrink-0 font-num text-[18px] font-semibold leading-[22px] text-brand">{i + 1}</span>
                  <div>
                    <div className="text-[15px] font-medium leading-[22px] text-white">{s.title}</div>
                    <p className="mt-0.5 text-[14px] leading-[21px] text-white/55">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Already have a BingX account?" sub="Two ways to qualify under the TradeVantage referral.">
            <ol className="divide-y divide-white/[0.07] text-[14px] leading-[21px] text-white/70">
              <li className="flex gap-4 py-3 first:pt-0">
                <span className="w-4 shrink-0 font-num text-[18px] font-semibold leading-[21px] text-brand">1</span>
                <p>
                  Create a new account with our{" "}
                  <a href={BINGX_REF_URL} target="_blank" rel="noopener noreferrer" className={link}>
                    referral link
                  </a>
                  .
                </p>
              </li>
              <li className="flex gap-4 py-3 last:pb-0">
                <span className="w-4 shrink-0 font-num text-[18px] font-semibold leading-[21px] text-brand">2</span>
                <p>
                  Transfer your KYC from your old account to a new one under the referral,{" "}
                  <a href={BINGX_KYC_TRANSFER_URL} target="_blank" rel="noopener noreferrer" className={link}>
                    following this guide
                  </a>
                  .
                </p>
              </li>
            </ol>
            <p className="mt-4 border-t border-white/[0.07] pt-4 text-[14px] leading-[21px] text-white/55">
              Questions? Reach us on WhatsApp or Telegram{" "}
              <a href={SUPPORT_TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={link}>
                {SUPPORT_TELEGRAM}
              </a>
              .
            </p>
          </Panel>
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Panel title="Enter the giveaway" sub="One entry per BingX UID.">
            <GiveawayForm />
          </Panel>
          <p className="mt-4 px-1 text-[12px] leading-[18px] text-white/30">
            Rewards are provided by BingX under their promotion terms. TradeVantage runs the $100 giveaway among
            verified entries. Trading involves substantial risk of loss.
          </p>
        </aside>
      </div>
    </main>
  );
}
