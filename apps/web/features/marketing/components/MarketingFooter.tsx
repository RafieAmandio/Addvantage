import Link from "next/link";
import { FUTURA } from "@/features/marketing/lib/data";
import { LogoMark, Wordmark } from "@/features/marketing/components/icons";

const link = "transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";

/** The old footer's columns, over a giant wordmark that rises letter by letter. */
export function MarketingFooter() {
  return (
    <footer className="relative z-10 overflow-hidden bg-black text-white">
      <div className="flex flex-wrap items-start justify-between gap-10 bg-white/[0.03] p-6 md:px-[140px] md:py-[100px]">
        <div className="flex w-full flex-col gap-[42px] md:max-w-[340px]">
          <div className="flex items-center gap-3">
            <span className="lv-dance inline-block">
              <LogoMark size={45} />
            </span>
            <Wordmark size={36} />
          </div>
          <p className="text-base font-light leading-[1.4]">
            +Vantage does not manage funds. TradeVantage accepts no liability for trading decisions made by recipients. Liability waiver enforced at signup. Prices on this page are real closes from a saved snapshot, shown as examples, not advice.
          </p>
        </div>
        <div className="flex w-full max-w-[227px] flex-col gap-[17px] text-base">
          <p className="font-bold">Surface</p>
          <p>Telegram (free pillars)</p>
          <p>DOMAIN web (paid)</p>
          <p>1v1 Consult</p>
        </div>
        <div className="flex w-full max-w-[227px] flex-col gap-[17px] text-base">
          <p className="font-bold">Operator</p>
          <Link href="/login" className={link}>
            Log in
          </Link>
          <Link href="/signup" className={link}>
            Request access
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 md:px-10">
        <Link href="#top" aria-label="+vantage, back to top" className="mt-12 block select-none text-brand md:mt-16">
          <span data-reveal="letters" aria-hidden className="flex items-baseline justify-center whitespace-nowrap font-medium leading-[0.78] tracking-[-0.04em]" style={{ fontFamily: FUTURA, fontSize: "clamp(4.5rem, 21.5vw, 19rem)" }}>
            {"+vantage".split("").map((ch, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.32em]">
                <span className={i === 0 ? "inline-block text-[0.66em] font-bold" : "inline-block"} style={{ ["--i" as string]: i }}>
                  {ch}
                </span>
              </span>
            ))}
          </span>
        </Link>

        <div className="mt-3 flex flex-wrap justify-between gap-4 border-t border-white/15 py-5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/55">
          <span>© {new Date().getFullYear()} TradeVantage</span>
          <span>Times in WIB, UTC+7</span>
          <Link href="#top" className="hover:text-brand">
            Back to top ↑
          </Link>
        </div>
      </div>
    </footer>
  );
}
